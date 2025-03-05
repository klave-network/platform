import { FC, useMemo } from 'react';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@klave/ui-kit/components/ui/select';

const AccountSelector: FC = () => {

    const navigate = useNavigate();
    const { orgSlug } = useParams();
    const { data: organisations } = api.v0.organisations.getAll.useQuery();
    const personals = useMemo(() => organisations?.filter(o => o?.personal) ?? [], [organisations]);
    const other = useMemo(() => organisations?.filter(o => o?.personal === false) ?? [], [organisations]);

    const changeValue = (value: string) => {
        if (value === '~$NEW$~')
            navigate('/organisation/new');
        else
            navigate(`/${value}`);
    };

    return (
        <Select value={orgSlug} defaultValue={orgSlug} onValueChange={changeValue}>
            <SelectTrigger className="mb-2">
                <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
                {personals.length > 0
                    ? <SelectGroup>
                        <SelectLabel>Personal Account</SelectLabel>
                        {personals.map(o => <SelectItem key={o.id} value={o.slug}>{o.slug.replace('~$~', '')}</SelectItem>)}
                    </SelectGroup>
                    : null}
                {other.length > 0
                    ? <SelectGroup>
                        <SelectLabel>Organisations</SelectLabel>
                        {other.map(o => <SelectItem key={o.id} value={o.slug}>{o.slug.replace('~$~', '')}</SelectItem>)}
                        <SelectItem value='~$NEW$~'>
                            <span className='flex flex-grow justify-between items-center gap-1 align-middle'>
                                <PlusCircledIcon className='inline' /> Create Organisation
                            </span>
                        </SelectItem>
                    </SelectGroup>
                    : <SelectGroup>
                        <SelectLabel>Organisations</SelectLabel>
                        <SelectItem value='~$NEW$~'>
                            <span className='flex flex-grow justify-between items-center gap-1 align-middle'>
                                <PlusCircledIcon className='inline' /> Create Organisation
                            </span>
                        </SelectItem>
                    </SelectGroup>}
            </SelectContent>
        </Select>
    );
};

export default AccountSelector;
