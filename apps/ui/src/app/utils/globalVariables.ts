const klaveApi = import.meta.env.VITE_KLAVE_API_URL ?? `${window.location.origin}/api`;
const klaveAuth = import.meta.env.VITE_KLAVE_AUTHSTATE_URL ?? `${window.location.origin}/auth`;
const secretariumId = import.meta.env.VITE_SECRETARIUM_ID_URL ?? `${window.location.origin}/id`;

if (['__KLAVE_API__', ''].includes(window.klaveFrontConfig.KLAVE_API__))
    window.klaveFrontConfig.KLAVE_API__ = klaveApi;

if (['__KLAVE_AUTH__', ''].includes(window.klaveFrontConfig.KLAVE_AUTH__))
    window.klaveFrontConfig.KLAVE_AUTH__ = klaveAuth;

if (['__SECRETARIUM_ID__', ''].includes(window.klaveFrontConfig.SECRETARIUM_ID__))
    window.klaveFrontConfig.SECRETARIUM_ID__ = secretariumId;
