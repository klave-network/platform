import { FC, useState, useEffect, DragEvent } from 'react';
import Editor from '@monaco-editor/react';
import { UilSpinner } from '@iconscout/react-unicons';
import { ClearKeyPair, Key } from '@secretarium/connector';
import { useSecretariumQuery } from '../utils/secretarium';
import { useLocalForage } from '../useLocalStorage';

type RunCommandProps = {
    address: string;
    functions?: string[];
}

type KeyPointer = {
    name: string;
    key: ClearKeyPair & {
        name?: string;
    };
}

export const RunCommand: FC<RunCommandProps> = ({ address, functions = [] }) => {

    const [route, setRoute] = useState(functions[0] ?? '');
    const [args, setArgs] = useState('');
    const [isHoveringKeys, setIsHoveringKeys] = useState(false);
    const [connectionKeys, setConnectionKeys] = useLocalForage<Array<KeyPointer>>('klave-v0-runner-keys', []);
    const [selectedPointer, setSelectedPointer] = useState('none');
    const [selectedKey, setSelectedKey] = useState<Key>();
    const [ephemeralKey, setEphemeralKey] = useState<Key>();
    const effectiveKey = selectedKey ?? ephemeralKey;
    let passedArgs = args;

    useEffect(() => {
        if (selectedPointer === 'none') {
            setSelectedKey(undefined);
        } else {
            const pointer = connectionKeys?.find(k => k.name === selectedPointer);
            if (pointer)
                Key.importKey(pointer.key).then(setSelectedKey).catch(console.error);
        }
    }, [selectedPointer, connectionKeys]);

    useEffect(() => {
        if (!ephemeralKey)
            Key.createKey().then(setEphemeralKey).catch(console.error);
    }, []);

    const removeCurrentKey = () => {
        if (selectedPointer === 'none')
            return;
        if (!confirm('Are you sure you want to delete this key?'))
            return;
        setConnectionKeys(connectionKeys?.filter(k => k.name !== selectedPointer) ?? []);
        setSelectedPointer('none');
    };

    const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {

        e.preventDefault();
        e.stopPropagation();

        const newKeys = connectionKeys?.reduce((acc, k) => {
            acc[k.name] = k;
            return acc;
        }, {} as Record<string, KeyPointer>) ?? {};

        const files = Array.from(e.dataTransfer.files);
        const reads = files.map(async file => {
            const read = await new Promise<(Omit<KeyPointer, 'key'> & { key: unknown }) | undefined>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        resolve({
                            name: file.name,
                            key: JSON.parse(e.target?.result as string)
                        });
                    } catch (e) {
                        resolve(undefined);
                    }
                };
                reader.readAsText(file);
            });
            if (!read)
                return undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const key = read.key as any;
            if (!key)
                return undefined;
            if (key.version != '2')
                return undefined;
            if (key.name)
                read.name = key.name;
            try {
                if (key.salt !== undefined) {
                    const password = prompt('Enter password');
                    if (!password)
                        return undefined;
                    read.key = await (await Key.importEncryptedKeyPair(key, password)).exportKey();
                }
            } catch (e) {
                return undefined;
            }
            if (read.key)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (read.key as KeyPointer['key']).name = read.name;
            return read as KeyPointer;
        });

        Promise.all(reads)
            .then((keys) => {
                let nextSelection = 'none';
                keys.forEach(k => {
                    if (k) {
                        if (nextSelection === 'none')
                            nextSelection = k.name;
                        newKeys[k.name] = k;
                    }
                });
                setConnectionKeys(Object.values(newKeys));
                setSelectedPointer(nextSelection);
            })
            .catch(console.error);

        setIsHoveringKeys(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent.dataTransfer) {
            e.nativeEvent.dataTransfer.dropEffect = 'copy';
            e.nativeEvent.dataTransfer.effectAllowed = 'all';
        }
        setIsHoveringKeys(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHoveringKeys(false);
    };

    try {
        JSON.parse(args);
    } catch (e) {
        passedArgs = JSON.stringify(args);
    }

    const { data, isLoading, errors, refetch } = useSecretariumQuery({ app: address, route, args: passedArgs, live: false, key: effectiveKey }, [address]);

    const downloadCurrentKey = () => {
        (async () => {

            const keyRef = effectiveKey;
            if (!keyRef)
                return;

            const name = (selectedPointer !== 'none' ? selectedPointer : prompt('Enter a name for the key')) ?? undefined;

            if (!name)
                return;

            if (name === 'none' || Object.keys(connectionKeys ?? {}).find(k => k === name))
                return alert('Key with this name already exists');

            const clearKey = await keyRef.exportKey();
            const clearDecoratedKey = { ...clearKey, name };
            const blob = new Blob([JSON.stringify(clearDecoratedKey)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            if (!(connectionKeys ?? []).find(k => k.name === name))
                setConnectionKeys([...(connectionKeys ?? []), { name: name, key: clearDecoratedKey }]);
            setSelectedPointer(name);

            a.href = url;
            a.download = `${name}.secretarium`;
            a.click();
            URL.revokeObjectURL(url);

        })().catch(console.error);
    };

    return <>
        <h2 className='font-bold mb-3'>Command runner</h2>
        <h3 className='mb-3'>Session identity</h3>
        <div onDrop={handleFileDrop} onDragOverCapture={handleDragOver} onDragLeaveCapture={handleDragLeave} className={`flex box-content ${isHoveringKeys ? ' bg-gray-100' : ''}`}>
            <select name='klave-route-name' value={selectedPointer} onChange={({ target }) => setSelectedPointer(target.value)} className={`${isHoveringKeys ? 'bg-cyan-700' : 'bg-gray-900'} justify-center align-middle items-center h-9 font-mono mb-2 text-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white w-1/3 text-sm`} >
                <option key='none' value="none" className='h-5'>Ephemeral</option>
                {connectionKeys?.map((k) => <option key={`key.${k.name}`} value={k.name}>{k.name}</option>)}
            </select>
            <button disabled={!effectiveKey} onClick={downloadCurrentKey} className="h-9 p-2 ml-1 mb-2 bg-gray-900 disabled:opacity-20 text-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white text-sm">Save</button>
            <button disabled={selectedPointer === 'none'} onClick={removeCurrentKey} className="h-9 p-2 ml-1 mb-2 bg-red-900 disabled:opacity-20 text-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white text-sm">Delete</button>
        </div>
        <h3 className='mb-3'>Execution input</h3>
        <div className='flex'>
            <select name='klave-route-name' onChange={({ target }) => setRoute(target.value)} className="h-9 font-mono mb-2 bg-gray-900 text-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white w-full text-sm" >
                {functions.map((f, i) => <option key={`function.${i}`} value={f}>{f}</option>)}
            </select>
            <button onClick={() => refetch()} className='btn btn-sm h-9 ml-1 mb-2 bg-gray-800 hover:bg-gray-600 text-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white rounded-none text-sm font-normal'>Go</button>
        </div>
        <Editor
            key={`args.${address}`}
            options={{
                minimap: { enabled: false },
                hover: { enabled: false },
                suggest: {
                    showFields: false,
                    showFunctions: false
                }
            }}
            theme='vs-dark'
            height="10vh"
            defaultLanguage="json"
            defaultValue={args}
            onChange={value => { if (value) setArgs(value); }}
        />
        <h3 className='my-3 h-5'>Application response {isLoading ? <UilSpinner className='inline-block animate-spin h-5' /> : ''}</h3>
        <Editor
            key={`result.${address}`}
            value={isLoading ? '// executing...' : data?.length ? JSON.stringify(data, null, 4) : errors?.length ? `// error${errors.length > 1 ? 's' : ''}: ${JSON.stringify(errors, null, 4).replaceAll('\n', '\n// ')}` : ''}
            options={{
                minimap: { enabled: false },
                semanticHighlighting: { enabled: false },
                hover: { enabled: false },
                readOnly: true,
                suggest: {
                    showFields: false,
                    showFunctions: false
                }
            }}
            theme='vs-dark'
            height="50vh"
            defaultLanguage="json"
        />
    </>;
};

export default RunCommand;