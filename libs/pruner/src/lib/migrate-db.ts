import { prisma } from '@klave/db';
import { Utils } from '@secretarium/connector';

let hasMigratedDBFields = false;

export const migrateDBFields = async () => {

    if (hasMigratedDBFields)
        return;

    hasMigratedDBFields = true;

    console.log('Migrating database fields...');
    const webCreds = await prisma.webauthCredential.findRaw({
        filter: {
            credentialPublicKey: {
                $exists: true
            }
        }
    });

    if (Array.isArray(webCreds) && webCreds.length > 0) {
        const webCredsHandle = webCreds as Array<Record<string, unknown>>;
        for (const cred of webCredsHandle) {
            const credId = cred['_id'] as string | undefined;
            const credPublicKey = cred['credentialPublicKey'] as string | undefined;
            if (!credId || !credPublicKey) {
                console.warn('Skipping credential migration due to missing fields', credId, credPublicKey);
                continue;
            }
            try {
                if (typeof credPublicKey === 'string') {
                    const publicKeyIntArray = Utils.fromBase64(credPublicKey);
                    console.log('Migrating credentialPublicKey', credId, credPublicKey, publicKeyIntArray);
                    await prisma.webauthCredential.update({
                        where: {
                            id: credId
                        },
                        data: {
                            credentialPublicKey: [...publicKeyIntArray]
                        }
                    });
                }
                if (typeof cred['credentialTransport'] === 'undefined') {
                    await prisma.webauthCredential.update({
                        where: {
                            id: credId
                        },
                        data: {
                            credentialTransport: 'internal'
                        }
                    });
                }
            } catch (e) {
                console.error('Error migrating credential', credId, e);
            }
        }
    }
};