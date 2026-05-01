import { UsersRepository, type UserRecord } from "./users.repository.js";

export type SyncCurrentUserInput = {
  clerkUserId: string;
  email?: string | null;
  name?: string | null;
  imageUrl?: string | null;
};

export class CurrentUserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async sync(input: SyncCurrentUserInput): Promise<UserRecord> {
    return this.usersRepository.upsertFromAuthProvider(input);
  }
}
