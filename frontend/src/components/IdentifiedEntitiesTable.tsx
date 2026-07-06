import React from 'react';
import { Player } from '@/types/player';
import { Team } from '@/types/team';
import '@material/web/progress/circular-progress.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/divider/divider.js';
import '@material/web/labs/card/outlined-card.js';
import useSWR from 'swr';
import apiClient from '@/utils/apiClient';

// Add a 'players' property to the Team type and enrich the Player type for this component
type EnrichedPlayer = Player & { 
    jerseyNumber?: number | null; 
    description?: string | null;
    teamAssignmentConfidence?: number;
};
type TeamWithPlayers = Team & { players: EnrichedPlayer[] };

interface IdentifiedEntitiesTableProps {
    gameId: string;
}

const IdentifiedEntitiesTable: React.FC<IdentifiedEntitiesTableProps> = ({ gameId }) => {
    const { data: teamsWithPlayers, error, isLoading, mutate } = useSWR<TeamWithPlayers[]>(gameId ? `/games/${gameId}/identified-entities` : null);

    const handleSwitchTeam = async (playerId: string) => {
        try {
            await apiClient.put(`/players/${playerId}/switch-team`, { gameId });
            mutate();
        } catch (err) {
            console.error("Failed to switch team:", err);
        }
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 0',
                gap: '16px',
            }}>
                <md-circular-progress indeterminate></md-circular-progress>
                <span style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '13px',
                }}>
                    Mapping Identities
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '16px 24px',
                backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--md-sys-color-error) 30%, transparent)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: 'var(--md-sys-color-error)',
            }}>
                <md-icon>error</md-icon>
                <p style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    {error.message || "Failed to fetch identified entities."}
                </p>
            </div>
        );
    }

    if (!teamsWithPlayers || teamsWithPlayers.length === 0) {
        return (
            <div style={{
                padding: '48px 0',
                textAlign: 'center',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '8px',
            }}>
                <md-icon style={{
                    fontSize: '36px',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    marginBottom: '16px',
                }}>
                    group_off
                </md-icon>
                <p style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--md-sys-color-on-surface-variant)',
                }}>
                    No entities identified in game events yet.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section title */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--md-sys-color-on-surface)',
                }}>
                    Identified Teams &amp; Players
                </h2>
                <div style={{
                    height: '1px',
                    flex: 1,
                    backgroundColor: 'var(--md-sys-color-outline-variant)',
                    marginLeft: '24px',
                }} />
            </div>

            {teamsWithPlayers.map((team: TeamWithPlayers) => (
                <md-outlined-card
                    key={team.id}
                    style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Team Header */}
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 700,
                                color: 'var(--md-sys-color-on-surface)',
                            }}>
                                {team.name}
                            </h3>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                backgroundColor: 'var(--md-sys-color-surface)',
                            }}>
                                {team.isTemp ? 'DETECTION GROUP' : 'OFFICIAL ROSTER'}
                            </span>
                        </div>
                        {!team.isTemp && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--md-sys-color-tertiary)',
                                }} />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                }}>
                                    SYNCED
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Players List */}
                    {team.players.length > 0 ? (
                        <md-list style={{ padding: 0 }}>
                            {team.players.map((player: EnrichedPlayer, idx: number) => (
                                <md-list-item
                                    key={player.id}
                                    style={{
                                        borderBottom: idx < team.players.length - 1
                                            ? '1px solid var(--md-sys-color-outline-variant)'
                                            : 'none',
                                        minHeight: '52px',
                                    }}
                                >
                                    <span slot="headline" style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: 'var(--md-sys-color-on-surface)',
                                    }}>
                                        {player.name || 'Unknown Player'}
                                    </span>
                                    <span slot="supporting-text" style={{
                                        fontSize: '12px',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                    }}>
                                        #{player.jerseyNumber ?? '-'} &middot; {player.description ?? 'No visual data available'}
                                    </span>
                                    <div slot="end">
                                        {player.id && (
                                            <md-text-button
                                                onClick={() => handleSwitchTeam(player.id)}
                                                style={{
                                                    '--md-text-button-container-shape': '6px',
                                                    fontSize: '12px',
                                                } as React.CSSProperties}
                                            >
                                                <md-icon slot="icon">swap_horiz</md-icon>
                                                Switch Team
                                            </md-text-button>
                                        )}
                                    </div>
                                </md-list-item>
                            ))}
                        </md-list>
                    ) : (
                        <div style={{
                            padding: '36px 0',
                            textAlign: 'center',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}>
                            No players identified for this group
                        </div>
                    )}
                </md-outlined-card>
            ))}
        </div>
    );
};

export default IdentifiedEntitiesTable;
