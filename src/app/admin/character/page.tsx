import { createClient } from "@/lib/supabase-server";
import CharacterList from "@/components/admin/CharacterList";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("character_concerns")
    .select("*, posts(content, created_at), profiles!character_concerns_user_id_fkey(nickname, country)")
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: resolved } = await supabase
    .from("character_concerns")
    .select("*, posts(content), profiles!character_concerns_user_id_fkey(nickname)")
    .not("resolved_at", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Character concerns</h1>
        <p className="text-sm text-gray-500 mt-1">
          Posts where Sage detected a pattern that goes against the room&apos;s
          foundation — rejection of monotheism, mockery of practice, promotion
          of harmful behaviour, or coercion against another member&apos;s practice.
        </p>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Sage already responded to the member with witness, not argument. Your
          job is to decide whether further care is needed: a private message,
          a one-on-one conversation, removal from the room, or simply marking
          this resolved.
        </p>
      </header>

      <CharacterList open={open ?? []} resolved={resolved ?? []} />
    </div>
  );
}
