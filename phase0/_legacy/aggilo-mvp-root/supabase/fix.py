with open('schema.sql', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = 'drop policy if exists "\1" on public.profiles;\ncreate policy "\1"\n  '

# Let's just do a manual replace
replacements = [
    (bad_str + 'on public.profiles for select', 'drop policy if exists "Profiles are viewable by everyone" on public.profiles;\ncreate policy "Profiles are viewable by everyone"\n  on public.profiles for select'),
    (bad_str + 'on public.profiles for update', 'drop policy if exists "Users can update their own profile" on public.profiles;\ncreate policy "Users can update their own profile"\n  on public.profiles for update'),
    (bad_str + 'on public.profiles for insert', 'drop policy if exists "Users can insert their own profile" on public.profiles;\ncreate policy "Users can insert their own profile"\n  on public.profiles for insert'),
    (bad_str + 'on public.posts for select', 'drop policy if exists "Posts are viewable by authenticated users" on public.posts;\ncreate policy "Posts are viewable by authenticated users"\n  on public.posts for select'),
    (bad_str + 'on public.posts for insert', 'drop policy if exists "Authenticated users can create posts" on public.posts;\ncreate policy "Authenticated users can create posts"\n  on public.posts for insert'),
    (bad_str + 'on public.posts for delete', 'drop policy if exists "Users can delete their own posts" on public.posts;\ncreate policy "Users can delete their own posts"\n  on public.posts for delete'),
    (bad_str + 'on public.dua_vault for select', 'drop policy if exists "Vault is viewable by authenticated users" on public.dua_vault;\ncreate policy "Vault is viewable by authenticated users"\n  on public.dua_vault for select')
]

for search, replace in replacements:
    content = content.replace(search, replace)

with open('schema.sql', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
