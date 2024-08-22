import { JSON } from '@klave/sdk';

@JSON
export class ErrorMessage {
    success!: boolean;
    message!: string;
}

@JSON
export class FetchInput {
    key!: string;
}

@JSON
export class FetchOutput {
    success!: boolean;
    value!: string;
}

@JSON
export class StoreInput {
    key!: string;
    value!: string;
}

@JSON
export class StoreOutput {
    success!: boolean;
}
