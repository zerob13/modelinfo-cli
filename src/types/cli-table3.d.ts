declare module "cli-table3" {
  export interface TableOptions {
    head?: string[];
    style?: {
      compact?: boolean;
      head?: string[];
      border?: string[];
    };
    wordWrap?: boolean;
  }

  export default class Table {
    public constructor(options?: TableOptions);
    public push(row: unknown[]): number;
    public toString(): string;
  }
}
