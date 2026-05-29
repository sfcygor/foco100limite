const path = require('path')
const Database = require('better-sqlite3')

// Use better-sqlite3 directly to seed since Prisma 7 adapter-based client
// is not easily scriptable outside of Next.js context
const db = new Database(path.join(__dirname, 'dev.db'))

const achievements = [
  { key: 'first_session', title: 'Primeiro Passo', description: 'Registrou sua primeira sessão de estudo', icon: '🚀', category: 'milestone', threshold: 1 },
  { key: 'streak_7', title: '7 Dias Seguidos', description: 'Estudou por 7 dias consecutivos', icon: '🔥', category: 'streak', threshold: 7 },
  { key: 'streak_30', title: '30 Dias de Fogo', description: 'Estudou por 30 dias consecutivos', icon: '💎', category: 'streak', threshold: 30 },
  { key: 'streak_100', title: 'Centurião', description: 'Estudou por 100 dias consecutivos', icon: '👑', category: 'streak', threshold: 100 },
  { key: 'hours_100', title: '100 Horas', description: 'Acumulou 100 horas de estudo', icon: '⏰', category: 'hours', threshold: 100 },
  { key: 'hours_500', title: '500 Horas', description: 'Acumulou 500 horas de estudo', icon: '🏆', category: 'hours', threshold: 500 },
  { key: 'hours_1000', title: 'Mil Horas', description: 'Acumulou 1000 horas de estudo — lenda!', icon: '⚡', category: 'hours', threshold: 1000 },
  { key: 'questions_1000', title: '1000 Questões', description: 'Respondeu 1000 questões', icon: '📝', category: 'questions', threshold: 1000 },
  { key: 'questions_5000', title: '5000 Questões', description: 'Respondeu 5000 questões — mestre das questões!', icon: '🎯', category: 'questions', threshold: 5000 },
  { key: 'weekly_goal', title: 'Meta Semanal', description: 'Atingiu a meta semanal de horas', icon: '✅', category: 'goal', threshold: 1 },
]

function generateCuid() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'c'
  for (let i = 0; i < 24; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

const upsert = db.prepare(`
  INSERT INTO Achievement (id, key, title, description, icon, category, threshold)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET
    title=excluded.title,
    description=excluded.description,
    icon=excluded.icon,
    category=excluded.category,
    threshold=excluded.threshold
`)

for (const a of achievements) {
  upsert.run(generateCuid(), a.key, a.title, a.description, a.icon, a.category, a.threshold)
}

console.log('✅ Achievements seeded successfully!')
db.close()
