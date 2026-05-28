<?php
/**
 * Aggilo — Clio Form Submission Handler  (v4 — robust)
 *
 * Routes:
 *   "Find My People"  → mypeople@aggilo.in
 *   "Make Your Crowd" → mycrowd@aggilo.in
 *
 * Features:
 *   • Strict input validation & sanitisation
 *   • CORS locked to aggilo.in (configurable)
 *   • Per-IP rate limiting (configurable, flat file)
 *   • mail() send with JSON file fallback if SMTP fails
 *   • Structured error log written to ../logs/clio_errors.log
 *   • All responses are JSON; no raw output ever leaks
 */

// ── Error suppression — all PHP errors captured, never echoed ─────────────────
ini_set('display_errors', '0');
error_reporting(E_ALL);
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    writeSysLog("PHP error [{$errno}] {$errstr} in {$errfile}:{$errline}");
    return true;
});

// ── Config ────────────────────────────────────────────────────────────────────
define('ALLOWED_ORIGINS', ['https://aggilo.in', 'https://www.aggilo.in']);
define('FROM_EMAIL',      'clio@aggilo.in');
define('FROM_NAME',       'Clio · Aggilo');
define('TO_FIND',         'mypeople@aggilo.in');
define('TO_MYC',          'mycrowd@aggilo.in');

// Fallback storage — submissions written here if mail() fails
define('FALLBACK_DIR',    __DIR__ . '/../submissions/');
// Error log
define('ERROR_LOG_PATH',  __DIR__ . '/../logs/clio_errors.log');
// Rate limit: max requests per window per IP
define('RATE_LIMIT_MAX',  5);
define('RATE_LIMIT_WIN',  300); // seconds (5 min)
define('RATE_LIMIT_DIR',  __DIR__ . '/../ratelimit/');

// ── Output always JSON ─────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');

// ── CORS ──────────────────────────────────────────────────────────────────────
$origin = isset($_SERVER['HTTP_ORIGIN']) ? trim($_SERVER['HTTP_ORIGIN']) : '';
if (in_array($origin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    // Allow from no-origin (same-host) or in dev; reject cross-origin others
    if ($origin !== '') {
        // Unknown origin — log and bail
        writeSysLog("CORS rejected origin: {$origin}");
        jsonOut(403, false, 'Origin not allowed');
    }
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

// ── Preflight ─────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Method guard ──────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(405, false, 'Method not allowed');
}

// ── Rate limit ────────────────────────────────────────────────────────────────
$ip = getClientIP();
if (!checkRateLimit($ip)) {
    writeSysLog("Rate limit hit: {$ip}");
    jsonOut(429, false, 'Too many requests. Please wait a few minutes.');
}

// ── Parse body ────────────────────────────────────────────────────────────────
$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') {
    jsonOut(400, false, 'Empty request body');
}

$data = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    writeSysLog("JSON parse error: " . json_last_error_msg() . " | raw=" . substr($raw, 0, 200));
    jsonOut(400, false, 'Invalid JSON payload');
}
if (!is_array($data)) {
    jsonOut(400, false, 'Payload must be a JSON object');
}

// ── Validate required fields ──────────────────────────────────────────────────
$formType    = isset($data['formType']) ? trim((string)$data['formType']) : 'find_my_people';
$isMYC       = ($formType === 'make_your_crowd');
$personName  = s($data, 'name', '');
$personEmail = isset($data['email']) ? trim((string)$data['email']) : '';

// Email is required for both flows
if ($personEmail === '' || !filter_var($personEmail, FILTER_VALIDATE_EMAIL)) {
    jsonOut(422, false, 'A valid email address is required.');
}

// Name is required
if ($personName === '') {
    jsonOut(422, false, 'A name is required.');
}

// ── Build email ───────────────────────────────────────────────────────────────
$to      = $isMYC ? TO_MYC : TO_FIND;
$subject = $isMYC
    ? "New Make Your Crowd — {$personName}"
    : "New Evaluation — {$personName}";
$html    = $isMYC ? buildMYCEmail($data) : buildFindEmail($data);

// ── Send mail ─────────────────────────────────────────────────────────────────
$encodedSubject  = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$encodedFromName = '=?UTF-8?B?' . base64_encode(FROM_NAME) . '?=';

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: quoted-printable\r\n";
$headers .= "From: {$encodedFromName} <" . FROM_EMAIL . ">\r\n";
$headers .= "Sender: " . FROM_EMAIL . "\r\n";
$headers .= "Return-Path: " . FROM_EMAIL . "\r\n";
$headers .= "Reply-To: {$personEmail}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 1\r\n";
$headers .= "X-Form-Type: " . ($isMYC ? 'make_your_crowd' : 'find_my_people') . "\r\n";

$mailSent = @mail($to, $encodedSubject, $html, $headers, '-f ' . FROM_EMAIL);

if ($mailSent) {
    // Also persist to file as audit trail
    persistSubmission($data, $formType, 'mail_ok');
    jsonOut(200, true, 'Received');
} else {
    // mail() failed — log and persist to file so no data is lost
    $errMsg = error_get_last() ? error_get_last()['message'] : 'mail() returned false';
    writeSysLog("mail() failed for {$personEmail} | type={$formType} | err={$errMsg}");
    $saved = persistSubmission($data, $formType, 'mail_failed');
    if ($saved) {
        // Saved to file — tell the client it was received (we'll manually process)
        jsonOut(200, true, 'Received');
    } else {
        jsonOut(500, false, 'Submission could not be saved. Please email hello@aggilo.in directly.');
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

/** Terminate with JSON response */
function jsonOut($code, $success, $message) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Safe scalar from $data */
function s($data, $key, $default = '—') {
    if (!isset($data[$key])) return $default;
    $v = $data[$key];
    if (is_array($v)) return implode(', ', array_map('clean', $v));
    $s = trim((string)$v);
    return ($s === '' || $s === 'null') ? $default : clean($s);
}

/** Strip HTML + encode special chars */
function clean($str) {
    return htmlspecialchars(strip_tags(trim((string)$str)), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Return clickable email anchor (safe) */
function emailLink($email) {
    $e = clean($email);
    return "<a href='mailto:{$e}' style='color:#2dd4bf;text-decoration:none'>{$e}</a>";
}

/** Return Google Maps link from coordinates */
function mapsLink($lat, $lng) {
    $lat = round((float)$lat, 6);
    $lng = round((float)$lng, 6);
    return "<a href='https://maps.google.com/?q={$lat},{$lng}' style='color:#2dd4bf;text-decoration:none'>📍 {$lat}, {$lng}</a>";
}

/** Get real client IP (handles proxies sensibly) */
function getClientIP() {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

/** Flat-file per-IP rate limit — returns true if allowed */
function checkRateLimit($ip) {
    if (!is_dir(RATE_LIMIT_DIR)) {
        @mkdir(RATE_LIMIT_DIR, 0700, true);
    }
    $safe = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $ip);
    $file = RATE_LIMIT_DIR . $safe . '.json';
    $now  = time();
    $log  = [];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $log = $raw ? (json_decode($raw, true) ?: []) : [];
    }
    // Prune old entries outside window
    $log = array_filter($log, function ($ts) use ($now) {
        return ($now - $ts) < RATE_LIMIT_WIN;
    });
    if (count($log) >= RATE_LIMIT_MAX) return false;
    $log[] = $now;
    @file_put_contents($file, json_encode(array_values($log)), LOCK_EX);
    return true;
}

/** Persist submission to JSON file (audit trail / mail-failed fallback) */
function persistSubmission($data, $formType, $status) {
    if (!is_dir(FALLBACK_DIR)) {
        $ok = @mkdir(FALLBACK_DIR, 0700, true);
        if (!$ok) { writeSysLog("Cannot create submissions dir: " . FALLBACK_DIR); return false; }
    }
    // Deny web access to this directory
    $htaccess = FALLBACK_DIR . '.htaccess';
    if (!file_exists($htaccess)) {
        @file_put_contents($htaccess, "Deny from all\n");
    }
    $data['_status']     = $status;
    $data['_savedAt']    = date('c');
    $data['_formType']   = $formType;
    $data['_source']     = 'india_landing';
    $data['_serverIP']   = getClientIP();
    $filename = FALLBACK_DIR . date('Ymd_His') . '_' . substr(md5(json_encode($data)), 0, 8) . '.json';
    $result   = @file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($result === false) {
        writeSysLog("Cannot write submission file: {$filename}");
        return false;
    }
    return true;
}

/** Write to the system error log */
function writeSysLog($msg) {
    $dir = dirname(ERROR_LOG_PATH);
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    @file_put_contents(ERROR_LOG_PATH, $line, FILE_APPEND | LOCK_EX);
}


// ══════════════════════════════════════════════════════════════════════════════
// Find My People email
// ══════════════════════════════════════════════════════════════════════════════
function buildFindEmail($d) {
    $gpsStr = (isset($d['gpsLat']) && $d['gpsLat'] !== '' && isset($d['gpsLng']) && $d['gpsLng'] !== '')
        ? mapsLink($d['gpsLat'], $d['gpsLng'])
        : '—';

    $rows = [
        ['Name',               s($d, 'name')],
        ['Source',             'India Landing (.in)'],
        ['Email',              emailLink(s($d, 'email', ''))],
        ['Birth year',         s($d, 'birthYear')],
        ['Life cohort',        s($d, 'cohort')],
        ['Gender',             s($d, 'gender')],
        ['Languages',          s($d, 'languages')],
        ['Interest domain',    s($d, 'interestDomain')],
        ['Location',           s($d, 'location')],
        ['GPS co-ordinates',   $gpsStr],
        ['Life moment',        s($d, 'situation')],
        ['Gathering sought',   s($d, 'gathering')],
        ['Duration of search', s($d, 'duration')],
        ['Platforms tried',    s($d, 'triedChips')],
        ['Why they failed',    s($d, 'alreadyTriedText')],
        ['Form version',       s($d, 'formVersion')],
        ['Submitted at',       s($d, 'submittedAt')],
    ];

    return emailTemplate(
        'New Evaluation',
        s($d, 'name'),
        TO_FIND,
        '#2dd4bf',
        '👤',
        'Find My People',
        $rows
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// Make Your Crowd email
// ══════════════════════════════════════════════════════════════════════════════
function buildMYCEmail($d) {
    $ageMin   = isset($d['ageMin']) && $d['ageMin'] !== '' ? clean($d['ageMin']) : '';
    $ageMax   = isset($d['ageMax']) && $d['ageMax'] !== '' ? clean($d['ageMax']) : '';
    $ageRange = ($ageMin !== '' || $ageMax !== '') ? "{$ageMin} – {$ageMax}" : '—';

    $rows = [
        ['Name',             s($d, 'name')],
        ['Source',           'India Landing (.in)'],
        ['Email',            emailLink(s($d, 'email', ''))],
        ['Phone',            s($d, 'phone')],
        ['Community',        s($d, 'activity')],
        ['Group size',       s($d, 'communitySize') . ' people'],
        ['Current platform', s($d, 'platforms')],
        ["What's broken",    s($d, 'whatsBroken')],
        ['Location / area',  s($d, 'location')],
        ['Languages',        s($d, 'languages')],
        ['Age range',        $ageRange],
        ['Gender mix',       s($d, 'genderMix')],
        ['Fill timeline',    s($d, 'timeline')],
        ['Form version',     s($d, 'formVersion')],
        ['Submitted at',     s($d, 'submittedAt')],
    ];

    return emailTemplate(
        'Make Your Crowd',
        s($d, 'name'),
        TO_MYC,
        '#a78bfa',
        '🏠',
        'Make Your Crowd',
        $rows
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// HTML email template
// ══════════════════════════════════════════════════════════════════════════════
function emailTemplate($title, $name, $recipient, $accentColor, $icon, $badge, $rows) {
    $rowsHtml = '';
    foreach ($rows as $row) {
        [$label, $value] = $row;
        if (!$value || $value === '—') continue;
        $l = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
        $rowsHtml .= "
        <tr>
          <td style='padding:11px 20px;font-size:11px;font-weight:700;text-transform:uppercase;
                     letter-spacing:0.07em;color:#7e8fa6;border-bottom:1px solid #1c2333;
                     vertical-align:top;width:32%;white-space:nowrap'>{$l}</td>
          <td style='padding:11px 20px;font-size:14px;color:#e2eaf3;border-bottom:1px solid #1c2333;
                     line-height:1.65'>{$value}</td>
        </tr>";
    }

    $year = date('Y');
    return "<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <title>{$title} — {$name}</title>
</head>
<body style='margin:0;padding:0;background:#06090f;font-family:Arial,Helvetica,sans-serif'>
  <table width='100%' cellpadding='0' cellspacing='0' border='0'
         style='background:#06090f;padding:40px 0'>
    <tr>
      <td align='center'>
        <table width='600' cellpadding='0' cellspacing='0' border='0'
               style='max-width:600px;width:100%'>

          <!-- Header -->
          <tr>
            <td style='background:linear-gradient(135deg,#0a1520 0%,#0d1117 100%);
                        border:1px solid rgba(45,212,191,0.18);
                        border-radius:16px 16px 0 0;padding:30px 32px;text-align:center'>
              <div style='font-size:28px;margin-bottom:10px'>{$icon}</div>
              <div style='font-size:20px;font-weight:800;color:{$accentColor};letter-spacing:0.03em'>
                ✦ Aggilo · Clio
              </div>
              <div style='margin-top:8px'>
                <span style='display:inline-block;background:rgba(45,212,191,0.08);
                             border:1px solid rgba(45,212,191,0.2);border-radius:50px;
                             padding:4px 14px;font-size:11px;font-weight:700;
                             letter-spacing:0.1em;text-transform:uppercase;color:{$accentColor}'>
                  {$badge}
                </span>
              </div>
              <div style='margin-top:12px;font-size:15px;color:#e2eaf3;font-weight:600'>
                {$title} — {$name}
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <tr>
            <td style='background:#0d1117;border:1px solid rgba(255,255,255,0.07);
                        border-top:none;padding:0;border-radius:0 0 16px 16px'>
              <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                {$rowsHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='padding:22px 0 0;text-align:center;font-size:12px;color:#4a5568'>
              Routed to <strong style='color:{$accentColor}'>{$recipient}</strong>
              &nbsp;·&nbsp; © {$year} Aggilo
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
}
