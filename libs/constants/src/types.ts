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

export type StagedOutputGroups = Record<'clone' | 'fetch' | 'install' | 'build', Array<{
    type: 'stdout' | 'stderr';
    full: boolean;
    time: string;
    data: string;
}>>