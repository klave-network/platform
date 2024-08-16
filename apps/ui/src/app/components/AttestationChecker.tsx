import { FC, useEffect, useMemo, useState } from 'react';
import { UilDownloadAlt, UilExternalLinkAlt, UilShieldCheck, UilShieldExclamation, UilSpinner } from '@iconscout/react-unicons';
import { Utils } from '@secretarium/connector';
import api from '../utils/api';
import { useSecretariumQuery } from '../utils/secretarium';
import { BackendVersion } from '@klave/constants';

type AttestationCheckerProps = {
    deploymentId: string;
    address: string;
    cluster?: string;
};

export const AttestationChecker: FC<AttestationCheckerProps> = ({ deploymentId, address, cluster }) => {

    const { data: deployment, isLoading: isLoadingDeployments } = api.v0.deployments.getById.useQuery({ deploymentId: deploymentId || '' });
    const [challenge, setChallenge] = useState(Array.from(Utils.getRandomBytes(64)));
    const [hasLaunched, setHasLaunched] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isContractValid, setIsContractValid] = useState(false);
    const [isQuoting, setIsQuoting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [quoteBinary, setQuoteBinary] = useState<Array<number>>([]);
    const quoteArgs = useMemo(() => ({ challenge }), [challenge]);
    const verifyArgs = useMemo(() => ({
        quote: quoteBinary,
        current_time: new Date().getTime()
    }), [quoteBinary]);
    const { data: quoteData, isLoading: loadingQuote, errors: quoteErrors, refetch: refetchQuote } = useSecretariumQuery<{
        quote: {
            report_body: {
                mr_enclave: {
                    m: Array<number>
                },
                mr_signer: {
                    m: Array<number>
                },
                report_data: Array<number>
            }
        },
        quote_binary: Array<number>,
    }>({
        cluster,
        app: address,
        route: 'klave.get_quote',
        args: quoteArgs,
        live: false
    }, [quoteArgs]);
    const { data: verifyData, isLoading: loadingVerify, errors: verifyErrors, refetch: refetchVerify } = useSecretariumQuery<{
        quote_verification_result: number;
        quote_verification_result_description: string;
        sa_list: string;
    }>({
        cluster,
        app: address,
        route: 'klave.verify_quote',
        args: verifyArgs,
        live: false
    }, [verifyArgs]);
    const { data: versions, refetch: refetchVersion } = useSecretariumQuery<BackendVersion['version']>({
        cluster,
        app: address,
        route: 'klave.version',
        live: false
    }, [deployment?.id]);

    useEffect(() => {
        if (!hasLaunched) {
            setHasLaunched(true);
            if (!loadingQuote && !isQuoting && !isVerifying) {
                setIsQuoting(true);
                refetchQuote();
            }
            refetchVersion();
        }
    }, [hasLaunched, refetchQuote, refetchVersion, isQuoting, isVerifying]);

    useEffect(() => {
        if (!hasLaunched || !quoteData || loadingQuote || quoteErrors?.length)
            return;
        const base = quoteData[0];
        if (!base || !base.quote_binary)
            return;
        if ((verifyData?.length ?? 0) > 0)
            return;
        if (!quoteBinary.length) {
            setQuoteBinary(base.quote_binary);
            setIsQuoting(false);
        }
    }, [hasLaunched, quoteData, loadingQuote, quoteErrors, verifyData]);

    useEffect(() => {
        if (isVerifying)
            return;
        if (!hasLaunched || !quoteData || !quoteBinary.length || (verifyData?.length ?? 0) > 0 || loadingVerify || verifyErrors?.length || quoteErrors?.length || !verifyArgs.quote.length)
            return;
        setIsVerifying(true);
        refetchVerify();
    }, [hasLaunched, quoteData, quoteBinary, verifyData, loadingVerify, refetchVerify, verifyErrors, verifyArgs, quoteErrors, loadingVerify, isVerifying]);

    const resetTest = () => {
        setChallenge(Array.from(Utils.getRandomBytes(64)));
        setQuoteBinary([]);
        setHasLaunched(false);
        setIsContractValid(false);
    };

    const secretariumBackendVersions = versions?.[0];
    const { wasm_version, core_version } = secretariumBackendVersions ?? { wasm_version: {}, core_version: {} };
    const secretariumCoreVersion = `${core_version.major}.${core_version.minor}.${core_version.patch}`;
    const secretariumWasmVersion = `${wasm_version.major}.${wasm_version.minor}.${wasm_version.patch}`;
    const verifyResult = verifyData?.[0];
    const loading = loadingQuote || loadingVerify || !verifyResult || isLoadingDeployments;
    const downloadableQuote = new Blob([new Uint8Array(quoteBinary)], { type: 'application/octet-stream' });
    const enclaveOutcomeLevel = QV_LEVEL(verifyResult?.quote_verification_result);
    const quoteDataTip = quoteData?.[0];
    const mrEnclaveHash = Utils.toBase64(new Uint8Array(quoteDataTip?.quote?.report_body?.mr_enclave?.m ?? []));
    const mrSignedHash = Utils.toBase64(new Uint8Array(quoteDataTip?.quote?.report_body?.mr_signer?.m ?? []));
    const contractIntegrityHash = Utils.toBase64(new Uint8Array(quoteDataTip?.quote?.report_body?.report_data ?? []));

    useEffect(() => {
        if (quoteDataTip?.quote?.report_body?.report_data && deployment?.buildOutputWASM) {
            const reportData = new Uint8Array(quoteDataTip?.quote.report_body.report_data);
            const contractBytes = Utils.fromBase64(deployment.buildOutputWASM);
            Utils.hash(contractBytes).then(async (contractBytesHash) => {
                const validation = new Uint8Array(challenge.length + contractBytesHash.length);
                validation.set(challenge);
                validation.set(contractBytesHash, challenge.length);
                return Utils.hash(validation).then((validationHash) => {
                    const reportHash = reportData.subarray(0, 32);
                    if (Utils.toHex(reportHash) === Utils.toHex(validationHash))
                        setIsContractValid(true);
                    setIsValidating(false);
                });
            }).catch(() => { return; });
        }
    }, [quoteData, deployment, challenge]);

    return <>
        <h2 className='font-bold mb-3'>Intel SGX Attestation</h2>
        {/* Tailwind needs the classes to be named in full to ship the classes */}
        <span className='bg-green-100 hidden'></span>
        <span className='bg-yellow-100 hidden'></span>
        <span className='bg-red-100 hidden'></span>
        <span className='bg-gray-100 hidden'></span>
        {/* End of tailwind's non-sense */}
        {
            loading
                ? <UilSpinner className='inline-block animate-spin h-5' />
                : quoteErrors?.length || verifyErrors?.length
                    ? <>
                        <h3 className='mt-5 mb-3'>Error</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-red-100 dark:bg-gray-800 p-3'>
                            {JSON.stringify(quoteErrors) ?? ''}{quoteErrors?.length ? <br /> : ''}
                            {JSON.stringify(verifyErrors) ?? ''}
                        </pre>
                        <button onClick={resetTest} className='btn btn-sm text-slate-600 font-normal text-sm py-1 px-3 mt-5'>Retry</button>
                    </>
                    : <>
                        <h3 className='mt-5 mb-3'>Enclave Verification Outcome</h3>
                        <pre className={`overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-${isValidating ? 'gray' : enclaveOutcomeLevel}-100 dark:bg-gray-800 p-3`}>
                            {enclaveOutcomeLevel !== 'red' ? <UilShieldCheck className='w-8 h-10 p-0 -ml-1 mb-2' /> : <UilShieldExclamation className='w-8 h-10 p-0 -ml-1 mb-2' />}
                            {verifyResult.quote_verification_result_description ?? ''}
                        </pre>
                        <h3 className='mt-5 mb-3'>Contract Integrity Validation</h3>
                        <pre className={`overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-${isValidating ? 'gray' : isContractValid ? 'green' : 'red'}-100 dark:bg-gray-800 p-3`}>
                            {isContractValid ? <UilShieldCheck className='w-8 h-10 p-0 -ml-1 mb-2' /> : <UilShieldExclamation className='w-8 h-10 p-0 -ml-1 mb-2' />}
                            {isValidating ? 'Checking contract validity' : isContractValid ? 'Contract integrity validated successfully' : 'Contract integrity not valid. Tampering detected.'}
                        </pre>
                        <h3 className='mt-5 mb-3'>Runtime</h3>
                        <span className='font-bold'>Secretarium Core :</span> {versions?.length ? <span className='text-gray-400'>v{secretariumCoreVersion} ({core_version.build_number})</span> : '-'}<br />
                        <span className='font-bold'>Secretarium WASM :</span> {versions?.length ? <span className='text-gray-400'>v{secretariumWasmVersion} ({wasm_version.build_number})</span> : '-'}<br />
                        <h3 className='mt-5 mb-3'>MRENCLAVE</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-gray-100 dark:bg-gray-800 p-3'>
                            {mrEnclaveHash}
                        </pre>
                        <h3 className='mt-5 mb-3'>MRSIGNER</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-gray-100 dark:bg-gray-800 p-3'>
                            {mrSignedHash}
                        </pre>
                        <h3 className='mt-5 mb-3'>Contract Integrity Digest</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-gray-100 dark:bg-gray-800 p-3'>
                            {contractIntegrityHash}
                        </pre>
                        <h3 className='mt-5 mb-3'>Challenge</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-gray-100 dark:bg-gray-800 p-3'>
                            {JSON.stringify(challenge) ?? ''}
                        </pre>
                        <h3 className='mt-5 mb-3'>Quote infromation</h3>
                        <a download={`intel_quote_${address}_${verifyArgs.current_time}.bin`} href={URL.createObjectURL(downloadableQuote)} className='text-klave-light-blue hover:underline flex align-middle items-center'>Download Quote .bin <UilDownloadAlt className='inline-block h-4' /></a>
                        <h3 className='mt-5 mb-3'>Applicable Intel Security Advisories</h3>
                        {
                            verifyResult.sa_list?.split(',')?.map((sa: string) => <a key={sa} title={sa} href={`https://www.intel.com/content/www/us/en/security-center/advisory/${sa.toLocaleLowerCase()}.html`} target='_blank' rel='noreferrer' className='text-klave-light-blue hover:underline flex align-middle items-center'>{sa} <UilExternalLinkAlt className='inline-block h-4' /></a>)
                        }
                        <h3 className='mt-5 mb-3'>Relying Party</h3>
                        <span className='font-bold'>Secretarium DCAP</span>
                    </>
        }
    </>;
};

const SGX_QL_QV_MK_ERROR = (code: number): number => {
    return 0x0000A000 | code;
};

const QV_CODE = {
    SGX_QL_QV_RESULT_OK: 0x0000,                                            ///< The Quote verification passed and is at the latest TCB level
    SGX_QL_QV_RESULT_MIN: SGX_QL_QV_MK_ERROR(0x0001),
    SGX_QL_QV_RESULT_CONFIG_NEEDED: SGX_QL_QV_MK_ERROR(0x0001),             ///< The Quote verification passed and the platform is patched to the latest TCB level but additional configuration of the SGX platform may be needed
    SGX_QL_QV_RESULT_OUT_OF_DATE: SGX_QL_QV_MK_ERROR(0x0002),               ///< The Quote is good but TCB level of the platform is out of date. The platform needs patching to be at the latest TCB level
    SGX_QL_QV_RESULT_OUT_OF_DATE_CONFIG_NEEDED: SGX_QL_QV_MK_ERROR(0x0003), ///< The Quote is good but the TCB level of the platform is out of date and additional configuration of the SGX Platform at its current patching level may be needed. The platform needs patching to be at the latest TCB level
    SGX_QL_QV_RESULT_INVALID_SIGNATURE: SGX_QL_QV_MK_ERROR(0x0004),         ///< The signature over the application report is invalid
    SGX_QL_QV_RESULT_REVOKED: SGX_QL_QV_MK_ERROR(0x0005),                   ///< The attestation key or platform has been revoked
    SGX_QL_QV_RESULT_UNSPECIFIED: SGX_QL_QV_MK_ERROR(0x0006),               ///< The Quote verification failed due to an error in one of the input
    SGX_QL_QV_RESULT_SW_HARDENING_NEEDED: SGX_QL_QV_MK_ERROR(0x0007),       ///< The TCB level of the platform is up to date, but SGX SW Hardening is needed
    SGX_QL_QV_RESULT_CONFIG_AND_SW_HARDENING_NEEDED: SGX_QL_QV_MK_ERROR(0x0008),   ///< The TCB level of the platform is up to date, but additional configuration of the platform at its current patching level may be needed. Moreove, SGX SW Hardening is also needed
    SGX_QL_QV_RESULT_MAX: SGX_QL_QV_MK_ERROR(0x00FF)                              ///< Indicate max result to allow better translation
};

const QV_CODE_OK = [QV_CODE.SGX_QL_QV_RESULT_OK, QV_CODE.SGX_QL_QV_RESULT_SW_HARDENING_NEEDED];
const QV_CODE_WARN = [QV_CODE.SGX_QL_QV_RESULT_OUT_OF_DATE, QV_CODE.SGX_QL_QV_RESULT_OUT_OF_DATE_CONFIG_NEEDED, QV_CODE.SGX_QL_QV_RESULT_SW_HARDENING_NEEDED, QV_CODE.SGX_QL_QV_RESULT_CONFIG_AND_SW_HARDENING_NEEDED];
const QV_CODE_ERR = [QV_CODE.SGX_QL_QV_RESULT_MIN, QV_CODE.SGX_QL_QV_RESULT_INVALID_SIGNATURE, QV_CODE.SGX_QL_QV_RESULT_REVOKED, QV_CODE.SGX_QL_QV_RESULT_UNSPECIFIED, QV_CODE.SGX_QL_QV_RESULT_MAX];

const QV_LEVEL = (code?: number): string => {
    if (code === undefined) return 'gray';
    return QV_CODE_OK.includes(code) ? 'green' : QV_CODE_WARN.includes(code) ? 'yellow' : QV_CODE_ERR.includes(code) ? 'red' : 'gray';
};

export default AttestationChecker;