import BaseBuilder from './baseBuilder';
import User, { IUserDocument } from '../../../src/app/model/user';

export default class UserBuilder extends BaseBuilder<IUserDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      email: 'test@example.com',
      password: 'TestPassword123',
      name: 'Test User',
      active: true,
    };
  }

  withEmail(email: string): UserBuilder {
    this.properties.email = email;
    return this;
  }

  withPassword(password: string): UserBuilder {
    this.properties.password = password;
    return this;
  }

  withName(name: string): UserBuilder {
    this.properties.name = name;
    return this;
  }

  withJobTitle(jobTitle: string): UserBuilder {
    this.properties.jobTitle = jobTitle;
    return this;
  }

  withActive(active: boolean): UserBuilder {
    this.properties.active = active;
    return this;
  }

  withInactive(): UserBuilder {
    this.properties.active = false;
    return this;
  }

  build(): Record<string, any> {
    return this.properties;
  }

  async buildDefault(): Promise<Record<string, any>> {
    return {};
  }

  async save(): Promise<IUserDocument> {
    return super.save(User);
  }
}
