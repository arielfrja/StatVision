import { DataSource, Repository } from "typeorm";
import { User } from "../entities";
import { ILogger } from "../interfaces/ILogger";

export class UserRepository {
    private repository: Repository<User>;

    constructor(
        dataSource: DataSource,
        private logger?: ILogger
    ) {
        this.repository = dataSource.getRepository(User);
    }

    async findByProviderUid(providerUid: string): Promise<User | null> {
        return this.repository.findOne({ where: { providerUid } });
    }

    async create(data: Partial<User>): Promise<User> {
        this.logger?.info(`UserRepository: Creating user ${data.email || data.providerUid}`);
        const user = this.repository.create(data);
        return this.repository.save(user);
    }
}
