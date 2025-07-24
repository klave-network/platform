import { FC } from 'react';
import prettyBytes from 'pretty-bytes';

type CostConsumption = {
    consumption: number;
    type: 'ingress' | 'egress' | 'read' | 'write' | 'wasm' | 'native';
    scope: 'query' | 'transaction' | 'deploy'
};

type CostFiniteAmount = {
    amount: number;
    type: 'total'
};

type CostDisplayProps = {
    basis: CostConsumption | CostFiniteAmount;
    compact?: boolean;
    size?: 'small' | 'medium' | 'large';
    justify?: 'start' | 'center' | 'end';
    className?: string;
};


export const getIntegerCost = ({ consumption, type, scope }: CostConsumption) => {

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
        unitValue = scope === 'query' ? 10 : 100;
    } else if (type === 'native') {
        unitValue = scope === 'query' ? 10 : 100;
    }
    const consumptionNumber = Number(consumption);
    const consumptionValue = consumptionNumber * unitValue;
    return consumptionValue;
};

const CostDisplay: FC<CostDisplayProps> = ({ basis, compact, size, justify, className }) => {

    const { type } = basis;
    let consumptionValue = 0;
    if (type === 'total')
        consumptionValue = (basis as CostFiniteAmount).amount;
    else
        consumptionValue = getIntegerCost(basis as CostConsumption);

    let currencyValue = consumptionValue / 100_000_000_000;
    const isNonNilTinyAmount = currencyValue <= 0.0001 && currencyValue > 0;
    if (isNonNilTinyAmount)
        currencyValue = 0.0001;

    let roundedCurrencyValue = currencyValue.toFixed(5);
    if (currencyValue > 0.1)
        roundedCurrencyValue = currencyValue.toFixed(2);
    else if (currencyValue > 0.01)
        roundedCurrencyValue = currencyValue.toFixed(3);
    else if (currencyValue > 0.001)
        roundedCurrencyValue = currencyValue.toFixed(4);

    if (type === 'total')
        return <span className={className}><span className={'text-klave-light-blue'}>{isNonNilTinyAmount ? '~' : ''}£{roundedCurrencyValue}</span></span>;

    if (compact)
        return <span className={className}><span className={'text-klave-light-blue'}>{isNonNilTinyAmount ? '~' : ''}£{roundedCurrencyValue}</span> <span className="text-slate-300 text-xs">({(type === 'wasm' || type === 'native') ? `${consumptionValue.toString()} instructions` : prettyBytes(consumptionValue / 1_000, { maximumFractionDigits: 2 })})</span></span>;

    return <span className={`flex flex-col flex-shrink justify-start items-${justify ?? 'start'} ${className ?? ''}`} >
        <span className={`text-klave-light-blue font-bold ${size === 'small' ? 'text-xl' : size === 'medium' ? 'text-2xl' : 'text-3xl'}`}>{isNonNilTinyAmount ? '~' : ''}£{currencyValue.toFixed(2)}</span>
        <span className="text-slate-300 text-xs">{(type === 'wasm' || type === 'native') ? `${consumptionValue.toString()} instructions` : prettyBytes(consumptionValue / 1_000, { maximumFractionDigits: 2 })}</span>
    </span>;
};


export default CostDisplay;