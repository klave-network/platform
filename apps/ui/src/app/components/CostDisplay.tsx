import { FC } from 'react';

type CostDisplayProps = {
    consumption: bigint | number;
    compact?: boolean;
    type: 'ingress' | 'egress' | 'read' | 'write' | 'wasm' | 'native';
    scope: 'query' | 'transaction' | 'deploy';
    size?: 'small' | 'medium' | 'large';
    justify?: 'start' | 'center' | 'end';
    className?: string;
};

const CostDisplay: FC<CostDisplayProps> = ({ consumption, type, scope, compact, size, justify, className }) => {

    let unitValue = 0;
    if (type === 'ingress') {
        unitValue = (scope === 'query' || scope === 'deploy') ? 10_000 : 100_000;
    } else if (type === 'egress') {
        unitValue = 10_000;
    } else if (type === 'read') {
        unitValue = 20_000;
    } else if (type === 'write') {
        unitValue = 100_000;
    } else if (type === 'wasm') {
        unitValue = scope === 'deploy' ? 0 : (scope === 'query' ? 10 : 100);
    } else if (type === 'native') {
        unitValue = scope === 'deploy' ? 0 : (scope === 'query' ? 10 : 100);
    }

    const consumptionNumber = Number(consumption);
    const consumptionValue = consumptionNumber * unitValue;

    let currencyValue = consumptionValue / 100_000_000;
    const isNonNilTinyAmount = currencyValue <= 0.01 && currencyValue > 0;

    if (isNonNilTinyAmount)
        currencyValue = 0.01;

    if (compact)
        return <span className={className}><span className={'text-klave-light-blue'}>{isNonNilTinyAmount ? '~' : ''}£{currencyValue.toFixed(2)}</span> <span className="text-slate-300 text-xs">({consumptionNumber.toString()} {(type === 'wasm' || type === 'native') ? 'Kredits' : 'Bytes'})</span></span>;

    return <span className={`flex flex-col flex-shrink justify-start items-${justify ?? 'start'} ${className ?? ''}`} >
        <span className={`text-klave-light-blue font-bold ${size === 'small' ? 'text-xl' : size === 'medium' ? 'text-2xl' : 'text-3xl'}`}>{isNonNilTinyAmount ? '~' : ''}£{currencyValue.toFixed(2)}</span>
        <span className="text-slate-300 text-xs">{consumptionNumber.toString()} {(type === 'wasm' || type === 'native') ? 'Kredits' : 'Bytes'}</span>
    </span>;
};


export default CostDisplay;