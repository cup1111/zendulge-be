import BaseBuilder from './baseBuilder';
import User from '../../../src/app/model/user';

export default class UserBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues, false); // Users typically don't have tenant
    this.properties = {
      email: 'test@example.com',
      password: 'TestPassword123',
      name: 'Test User',
      active: true,
    };
  }

  withEmail(email) {
    this.properties.email = email;
    return this;
  }

  withPassword(password) {
    this.properties.password = password;
    return this;
  }

  withName(name) {
    this.properties.name = name;
    return this;
  }

  withJobTitle(jobTitle) {
    this.properties.jobTitle = jobTitle;
    return this;
  }

  withActive(active) {
    this.properties.active = active;
    return this;
  }

  withInactive() {
    this.properties.active = false;
    return this;
  }

  build() {
    return this.properties;
  }

  async buildDefault() {
    return {};
  }

  async save() {
    return super.save(User);
  }
}
