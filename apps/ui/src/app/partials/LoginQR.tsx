import { FC, useState, useCallback, useEffect } from 'react';
import QRCode from 'react-qr-code';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { v4 as uuid } from 'uuid';
import secretariumLogo from '../images/secretarium-logo.svg';
import { useAuth } from '../AuthProvider';

export const LoginQR: FC = () => {

    const { login } = useAuth();
    const [uuidLocator, setUuidLocator] = useState<string>();
    const [uuidBeacon, setUuidBeacon] = useState<string>();
    const [addressDestination, setAddressDestination] = useState<string>();
    const socketAddress = new URL(import.meta.env['VITE_KLAVE_API_URL']);
    socketAddress.protocol = socketAddress.protocol === 'https:' ? 'wss:' : 'ws:';
    const [socketUrl] = useState(`${socketAddress.origin}/bridge`);
    const codeValue = `cryptx_check#${addressDestination}#${uuidBeacon}#${uuidLocator}`;

    const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
        reconnectAttempts: 5,
        reconnectInterval: 1,
        shouldReconnect: () => true
    });

    const isConnected = readyState === ReadyState.OPEN;

    useEffect(() => {
        if (uuidLocator || !isConnected)
            return;
        const newLocator = uuid();
        setUuidLocator(newLocator);
        setTimeout(() => sendMessage(`request#${newLocator}`), 500);

    }, [isConnected, sendMessage, uuidLocator]);

    useEffect(() => {
        if (!lastMessage)
            return;
        const [verb, data, address] = lastMessage.data.split('#');
        switch (verb) {
            case 'sid':
                setUuidBeacon(data);
                setAddressDestination(address);
                break;
            case 'confirmed':
                fetch(`${import.meta.env['VITE_KLAVE_API_URL']}/login/print`, {
                    credentials: 'include'
                })
                    .then(async res => res.json())
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .then(udata => login(udata as any))
                    .catch(() => { return; });
                break;
        }
    }, [lastMessage, login, sendMessage]);

    const handleClickSendMessage = useCallback(() => {
        if (isConnected)
            setUuidLocator(undefined);
    }, [isConnected]);

    return <div className="text-center pb-12 md:pb-16">
        <br />
        <div className='pb-5' >
            <h1 className='text-xl font-bold'>Secretarium Pocket</h1>
            {isConnected
                ? <span>Open and scan to connect</span>
                : <span>We can't connect you at the moment.<br />Please try again later.</span>
            }
            <br />
            <br />
            <br />
        </div>
        {isConnected && addressDestination && uuidBeacon && uuidLocator
            ? <div className='relative h-[200px] min-w-[200px]'>
                <span className='absolute block overflow-hidden top-0 left-[calc(50%-100px)] w-[200px] h-[200px]'>
                    <QRCode level='L' value={codeValue} size={200} onClick={handleClickSendMessage} />
                </span>
                <span className='absolute block overflow-hidden rounded-full p-1 pt-1 top-[calc(50%-20px)] left-[calc(50%-20px)] w-[40px] h-[40px] bg-white'>
                    <img alt='Secretarium' src={secretariumLogo} />
                </span>
                <br />
                <br />
            </div>
            : null}
    </div>;
};

export default LoginQR;