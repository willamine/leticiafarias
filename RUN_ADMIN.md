# Run admin server (in project root):
cp .env.example .env && edit .env to add SUPABASE_SECRET_KEY
npm run start:admin

# Then POST to verify-session:
curl -X POST http://localhost:3000/admin/verify-session -H 'Content-Type: application/json' -d '{access_token:YOUR_ACCESS_TOKEN}'
