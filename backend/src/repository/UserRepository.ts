import { DataSource, Repository } from "typeorm";
import { User } from "../core/entities/User";

export class UserRepository {
    private repository: Repository<User>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(User);
    }

    async findByProviderUid(providerUid: string): Promise<User | null> {
        return this.repository.findOne({ where: { providerUid } });
    }

    async findById(id: string): Promise<User | null> {
        return this.repository.findOne({ where: { id } });
    }

    async save(user: User): Promise<User> {
        return this.repository.save(user);
    }
}
