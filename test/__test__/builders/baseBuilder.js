import db from '../../setup/db';

export default class BaseBuilder {
  constructor(defaultValues = true, hasTenant = true) {
    this.useDefault = defaultValues;
    this.properties = hasTenant ? { tenant: db.defaultTenant._id } : {};
  }

  async buildDefault() {
    // To be overridden by child classes
    return this;
  }

  async save(model) {
    let defaultResult = {};
    const filteredBuildResult = {
      ...this.properties,
      ...Object.fromEntries(
        Object.entries(this.build()).filter(([_, value]) => value !== null && value !== undefined),
      ),
    };

    if (this.useDefault) {
      defaultResult = await this.buildDefault();
    }
    const data = { ...defaultResult, ...filteredBuildResult };
    return model.create(data);
  }
}
