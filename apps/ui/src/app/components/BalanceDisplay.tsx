import { FC } from 'react';

type BalanceDisplayProps = {
    kredits: bigint | number;
    compact?: boolean;
    size?: 'small' | 'medium' | 'large';
    justify?: 'start' | 'center' | 'end';
    className?: string;
};

const BalanceDisplay: FC<BalanceDisplayProps> = ({ kredits, compact, size, justify, className }) => {

    const kreditsNumber = Number(kredits);
    let currencyValue = kreditsNumber / 100_000_000;
    const isNonNilTinyAmount = kreditsNumber > 0 && kreditsNumber < 1_000_000;

    if (isNonNilTinyAmount)
        currencyValue = 0.01;

    if (compact)
        return <span className={className}><span className={'text-klave-light-blue'}>{isNonNilTinyAmount ? '~' : ''}£{currencyValue.toFixed(2)}</span></span>;

    return <span className={`flex flex-col flex-shrink justify-start items-${justify ?? 'start'} ${className ?? ''}`} >
        <span className={`text-klave-light-blue font-bold ${size === 'small' ? 'text-xl' : size === 'medium' ? 'text-2xl' : 'text-3xl'}`}>{isNonNilTinyAmount ? '~' : ''}£{currencyValue.toFixed(2)}</span>
    </span>;
};


export default BalanceDisplay;