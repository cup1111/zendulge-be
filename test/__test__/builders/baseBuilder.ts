import { Model, Document } from 'mongoose';

export default class BaseBuilder<T extends Document = Document> {
  protected useDefault: boolean;

  protected properties: Record<string, any>;

  constructor(defaultValues: boolean = true) {
    this.useDefault = defaultValues;
    this.properties = {};
  }

  async buildDefault(): Promise<Record<string, any>> {
    // To be overridden by child classes
    return {};
  }

  build(): Record<string, any> {
    // To be overridden by child classes
    return this.properties;
  }

  async save(model: Model<T>): Promise<T> {
    let defaultResult: Record<string, any> = {};
    const filteredBuildResult = {
      ...this.properties,
      ...Object.fromEntries(
        Object.entries(this.build()).filter(([, value]) => value !== null && value !== undefined),
      ),
    };

    if (this.useDefault) {
      defaultResult = await this.buildDefault();
    }
    const data = { ...defaultResult, ...filteredBuildResult };
    return model.create(data);
  }
}
