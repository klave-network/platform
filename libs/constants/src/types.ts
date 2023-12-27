export type BackendVersion = {
    version: {
        core_version: {
            major: number;
            minor: number;
            patch: number;
            build_number: number;
        };
        wasm_version: {
            major: number;
            minor: number;
            patch: number;
            build_number: number;
        };
    };
}

export type KlaveGetCreditResult = {
    kredit: bigint
}