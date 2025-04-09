import { JSON } from '@klave/sdk';

@json
export class ErrorMessage {
    success!: boolean;
    message!: string;
}

@json
export class FetchInput {
    key!: string;
}

@json
export class FetchOutput {
    success!: boolean;
    value!: string;
}

@json
export class StoreInput {
    key!: string;
    value!: string;
}

@json
export class StoreOutput {
    success!: boolean;
}
