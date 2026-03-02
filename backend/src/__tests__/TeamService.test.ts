import { DataSource } from 'typeorm';
import { TeamService } from '../service/TeamService';
import { Team } from '../core/entities/Team';
import { User } from '../core/entities/User';

describe('TeamService', () => {
    let teamService: TeamService;
    let mockDataSource: Partial<DataSource>;
    let mockTeamRepo: any;

    beforeEach(() => {
        mockTeamRepo = {
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'new-team-id', ...data })),
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
        };

        mockDataSource = {
            getRepository: jest.fn().mockReturnValue(mockTeamRepo),
        };

        teamService = new TeamService(mockDataSource as DataSource);
    });

    it('should create a new team correctly', async () => {
        const teamName = 'Lakers';
        const mockUser = { id: 'user-123' } as User;

        const result = await teamService.createTeam(teamName, mockUser);

        expect(mockTeamRepo.create).toHaveBeenCalledWith({
            name: teamName,
            user: mockUser,
            userId: mockUser.id
        });
        expect(mockTeamRepo.save).toHaveBeenCalled();
        expect(result).toHaveProperty('id', 'new-team-id');
        expect(result.name).toBe(teamName);
    });
});
