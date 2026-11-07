import bcrypt from 'bcrypt';
import db from '../src/config/db';
import type { ApplicationStatus, MatchStatus, UserRole } from '../src/types';

type SeedUser = {
  email: string;
  password: string;
  role: UserRole;
};

const users: SeedUser[] = [
  { email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { email: 'coach@example.com', password: 'coach123', role: 'coach' },
  { email: 'fan@example.com', password: 'fan123', role: 'fan' },
];

const getOrCreateUser = async ({ email, password, role }: SeedUser): Promise<number> => {
  const existing = await db.query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await db.query<{ id: number }>(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
    [email, passwordHash, role],
  );
  return created.rows[0].id;
};

const getOrCreateTeam = async (
  name: string,
  description: string,
  coachId: number,
): Promise<number> => {
  const existing = await db.query<{ id: number }>('SELECT id FROM teams WHERE name = $1', [name]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await db.query<{ id: number }>(
    'INSERT INTO teams (name, description, coach_id) VALUES ($1, $2, $3) RETURNING id',
    [name, description, coachId],
  );
  return created.rows[0].id;
};

const getOrCreateTournament = async (
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  createdBy: number,
): Promise<number> => {
  const existing = await db.query<{ id: number }>('SELECT id FROM tournaments WHERE name = $1', [name]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await db.query<{ id: number }>(
    `INSERT INTO tournaments (name, description, start_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, description, startDate, endDate, createdBy],
  );
  return created.rows[0].id;
};

const upsertApplication = async (
  tournamentId: number,
  teamId: number,
  status: ApplicationStatus,
): Promise<void> => {
  await db.query(
    `INSERT INTO applications (tournament_id, team_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (tournament_id, team_id) DO NOTHING`,
    [tournamentId, teamId, status],
  );
};

const getOrCreateMatch = async (
  tournamentId: number,
  homeTeamId: number,
  awayTeamId: number,
  matchDate: string,
  status: MatchStatus,
  homeScore: number,
  awayScore: number,
): Promise<void> => {
  const existing = await db.query<{ id: number }>(
    `SELECT id FROM matches
     WHERE tournament_id = $1 AND home_team_id = $2 AND away_team_id = $3`,
    [tournamentId, homeTeamId, awayTeamId],
  );
  if (existing.rows[0]) {
    return;
  }

  await db.query(
    `INSERT INTO matches (tournament_id, home_team_id, away_team_id, match_date, status, home_score, away_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [tournamentId, homeTeamId, awayTeamId, matchDate, status, homeScore, awayScore],
  );
};

const seed = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed не можна запускати у production.');
  }

  const adminId = await getOrCreateUser(users[0]);
  const coachId = await getOrCreateUser(users[1]);
  await getOrCreateUser(users[2]);

  const dynamoId = await getOrCreateTeam('Динамо Київ', 'Київський клуб', coachId);
  const shakhtarId = await getOrCreateTeam('Шахтар Донецьк', 'Донецький клуб', coachId);
  const zoryaId = await getOrCreateTeam('Зоря Луганськ', 'Луганський клуб', adminId);
  const dniproId = await getOrCreateTeam('Дніпро-1', 'Дніпровський клуб', coachId);

  const cupId = await getOrCreateTournament(
    'Кубок України 2026',
    'Національний кубок',
    '2026-03-01',
    '2026-06-30',
    adminId,
  );
  const summerLeagueId = await getOrCreateTournament(
    'Літня ліга 2026',
    'Літній турнір',
    '2026-06-01',
    '2026-08-31',
    coachId,
  );

  await upsertApplication(cupId, dynamoId, 'approved');
  await upsertApplication(cupId, shakhtarId, 'approved');
  await upsertApplication(cupId, zoryaId, 'pending');
  await upsertApplication(summerLeagueId, dniproId, 'pending');
  await upsertApplication(summerLeagueId, dynamoId, 'rejected');

  await getOrCreateMatch(cupId, dynamoId, shakhtarId, '2026-04-10T18:00:00Z', 'finished', 2, 1);
  await getOrCreateMatch(cupId, zoryaId, dynamoId, '2026-05-15T16:00:00Z', 'scheduled', 0, 0);
  await getOrCreateMatch(summerLeagueId, shakhtarId, dniproId, '2026-06-20T17:00:00Z', 'in_progress', 1, 1);
  await getOrCreateMatch(summerLeagueId, dynamoId, dniproId, '2026-07-01T18:30:00Z', 'scheduled', 0, 0);

  console.log('Seed completed successfully!');
  console.log('Development accounts:');
  for (const user of users) {
    console.log(` - ${user.role}: ${user.email} / ${user.password}`);
  }
};

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
