-- Ejecutar este SQL en tu base de datos Postgres para crear tablas básicas.

CREATE TABLE IF NOT EXISTS "users" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "messages" (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  room TEXT DEFAULT 'global',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);