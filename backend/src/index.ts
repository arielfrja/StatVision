import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { Player } from "./Player";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "statsvision_user",
    password: "statsvision_password",
    database: "statsvision_db",
    synchronize: true,
    logging: false,
    entities: [User, Team, Player, Game, GameEvent],
    subscribers: [],
    migrations: [],
});

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
        // Here you can start your Express server or run other logic
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
