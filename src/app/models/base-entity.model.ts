// Abstract class for shared entity properties
export abstract class BaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt?: Date;
}
