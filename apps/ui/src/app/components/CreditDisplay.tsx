import { FC } from 'react';

type CreditDisplayProps = {
    kredits: bigint | number;
    size?: 'small' | 'medium' | 'large';
    justify?: 'start' | 'center' | 'end';
    className?: string;
}

const CreditDisplay: FC<CreditDisplayProps> = ({ kredits, size, justify, className }) => {

    const kreditsNumber = Number(kredits);
    const currencyValue = kreditsNumber / 100_000_000;

    return <div className={`flex flex-col flex-shrink justify-start items-${justify ?? 'start'} ${className ?? ''}`} >
        <span className={`text-klave-light-blue font-bold ${size === 'small' ? 'text-xl' : size === 'medium' ? 'text-2xl' : 'text-3xl'}`}>£{currencyValue.toFixed(2)}</span>
        <span className="text-slate-300 text-xs">{kreditsNumber.toString()} Kredits</span>
    </div>;
};


export default CreditDisplay;