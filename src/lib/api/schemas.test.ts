import { describe, expect, it } from 'vitest';
import { extractTeamDetails, extractTeamMembers, extractTeams } from './schemas';

describe('extractTeams', () => {
  it('parses plain teams array', () => {
    const teams = extractTeams([
      { _id: 't1', name: 'unit-labs', role: 'owner' },
      { _id: 't2', name: 'pixel-core', role: 'member' },
    ]);

    expect(teams).toHaveLength(2);
    expect(teams[0].id).toBe('t1');
    expect(teams[0].name).toBe('unit-labs');
    expect(teams[0].role).toBe('owner');
  });

  it('parses memberships with nested team object', () => {
    const teams = extractTeams({
      memberships: [{ role: 'member', team: { _id: 'nested-1', name: 'unit-labs' } }],
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('nested-1');
    expect(teams[0].name).toBe('unit-labs');
    expect(teams[0].role).toBe('member');
  });

  it('falls back to first array key for unknown wrapper', () => {
    const teams = extractTeams({
      results: [{ team_id: 'fallback-1', team_name: 'alpha-team' }],
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('fallback-1');
    expect(teams[0].name).toBe('alpha-team');
  });

  it('supports single team object response', () => {
    const teams = extractTeams({ _id: 'one-1', name: 'solo-team' });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('one-1');
    expect(teams[0].name).toBe('solo-team');
  });

  it('parses backend teams payload with nested team and myRole', () => {
    const teams = extractTeams({
      status: 'ok',
      teams: [
        {
          team: {
            _id: '69931f174f0a4440fdc468d6',
            name: 'unit-labs',
            owner_id: '698ce609f96e6dd5d2e34de5',
            createdAt: '2026-02-16T13:43:51.417Z',
            updatedAt: '2026-02-16T13:43:51.417Z',
          },
          myRole: 'owner',
        },
      ],
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('69931f174f0a4440fdc468d6');
    expect(teams[0].name).toBe('unit-labs');
    expect(teams[0].role).toBe('owner');
  });
});

describe('team details and members extractors', () => {
  it('parses team details payload', () => {
    const details = extractTeamDetails({
      status: 'ok',
      data: {
        id: 'team-1',
        name: 'unit-labs',
        owner_id: 'owner-1',
        myRole: 'owner',
        stats: {
          members: 4,
          projects: 7,
        },
      },
    });

    expect(details.id).toBe('team-1');
    expect(details.name).toBe('unit-labs');
    expect(details.ownerId).toBe('owner-1');
    expect(details.myRole).toBe('owner');
    expect(details.stats.members).toBe(4);
    expect(details.stats.projects).toBe(7);
  });

  it('parses team members payload', () => {
    const members = extractTeamMembers({
      status: 'ok',
      data: {
        members: [
          { id: 'u1', username: 'yonas', email: 'yonas@example.com', role: 'owner' },
          { id: 'u2', username: 'dev1', email: 'dev1@example.com', role: 'member' },
        ],
      },
    });

    expect(members).toHaveLength(2);
    expect(members[0].id).toBe('u1');
    expect(members[0].username).toBe('yonas');
    expect(members[0].role).toBe('owner');
  });
});
