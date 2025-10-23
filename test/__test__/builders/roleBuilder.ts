import BaseBuilder from './baseBuilder';
import Role, { IRoleDocument } from '../../../src/app/model/role';
import { RoleName } from '../../../src/app/enum/roles';

export default class RoleBuilder extends BaseBuilder<IRoleDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      name: RoleName.EMPLOYEE,
      description: 'Employee with limited access to company resources',
      isActive: true,
    };
  }

  withName(name: RoleName): RoleBuilder {
    this.properties.name = name;
    return this;
  }

  withDescription(description: string): RoleBuilder {
    this.properties.description = description;
    return this;
  }

  withActive(isActive: boolean): RoleBuilder {
    this.properties.isActive = isActive;
    return this;
  }

  build(): any {
    return this.properties;
  }

  async buildDefault(): Promise<any> {
    return {};
  }

  async save(): Promise<IRoleDocument> {
    return super.save(Role);
  }
}
