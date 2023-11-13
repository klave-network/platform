import { FC, forwardRef, PropsWithChildren, useMemo } from 'react';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';

const AccountSelector: FC<{ className?: string; }> = ({ className }) => {

    const navigate = useNavigate();
    const { orgSlug } = useParams();
    const { data: organisations } = api.v0.organisations.getAll.useQuery();
    const personals = useMemo(() => organisations?.filter(Boolean).filter(o => o.personal) ?? [], [organisations]);
    const other = useMemo(() => organisations?.filter(Boolean).filter(o => o.personal === false) ?? [], [organisations]);

    const changeValue = (value: string) => {
        if (value === '~$NEW$~')
            navigate('/organisation/new');
        else
            navigate(`/${value}`);
    };

    return <Select.Root value={orgSlug} defaultValue={orgSlug} onValueChange={changeValue}>
        <Select.Trigger className={`inline-flex justify-between flex-grow w-full items-center text-klave-light-blue bg-white data-[placeholder]:text-klave-light-blue mt-3 mb-5 ${className}`}>
            <Select.Value placeholder="Select an account" />
            <Select.Icon>
                <ChevronDownIcon />
            </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
            <Select.Content className="overflow-hidden bg-white shadow-outline rounded-lg w-full z-[1000]">
                <Select.ScrollUpButton>
                    <ChevronUpIcon />
                </Select.ScrollUpButton>
                <Select.Viewport>
                    {personals.length > 0
                        ? <Select.Group>
                            <Select.Label className="text-xs text-slate-400 px-3 py-1">Personal Account</Select.Label>
                            {personals.map(o => <SelectItem key={o.id} value={o.slug} className="px-3 py-2 hover:text-klave-cyan hover:cursor-pointer">{o.slug.replace('~$~', '')} <span className='text-slate-400'>- {o.name}</span></SelectItem>)}
                        </Select.Group>
                        : null}
                    <Select.Separator className="text-xs text-slate-400 p-1" />
                    <Select.Group>
                        <Select.Label className="text-xs text-slate-400 px-3 py-1">Organisations</Select.Label>
                        {other.map(o => <SelectItem key={o.id} value={o.slug} className='px-3 py-2 hover:text-klave-cyan hover:cursor-pointer overflow-hidden'>{o.slug} <span className='text-slate-400 overflow-hidden'>- {o.name}</span></SelectItem>)}
                        <SelectItem value='~$NEW$~' className='overflow-clip flex flex-grow px-3 py-2 w-full hover:text-klave-cyan hover:cursor-pointer'><span className='flex flex-grow justify-between items-center gap-1 align-middle'><PlusCircledIcon className='inline' /> Create Organisation</span></SelectItem>
                    </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton>
                    <ChevronDownIcon />
                </Select.ScrollDownButton>
            </Select.Content>
        </Select.Portal>
    </Select.Root>;
};

const SelectItem = forwardRef<HTMLDivElement, PropsWithChildren<{
    value: string;
    disabled?: boolean;
    className?: string;
}>>(({ children, className, ...props }, forwardedRef) => {
    return (
        <Select.Item className={`flex h-9 items-center select-none relative px-5 data-[disabled]:text-slate-300 data-[disabled]:pointer-events-none data-[highlighted]:text-klave-light-blue data-[highlighted]:bg-blue-100 data-[highlighted]:outline-none ${className}`} {...props} ref={forwardedRef}>
            <Select.ItemText>{children}</Select.ItemText>
            <Select.ItemIndicator className="SelectItemIndicator">
                <CheckIcon />
            </Select.ItemIndicator>
        </Select.Item>
    );
});

export default AccountSelector;