import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps } from 'react-hook-form';
import { z } from 'zod';
interface Zod3Type<O = unknown, I = unknown> {
    _output: O;
    _input: I;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _zod: any;
    _def: {
        typeName?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    '~standard': any
}

export const useZodForm = <TSchema extends z.ZodType>(
    props: Omit<UseFormProps<TSchema['_input']>, 'resolver'> & {
        schema: TSchema;
    }
) => {
    const form = useForm<TSchema['_input']>({
        ...props,
        resolver: zodResolver(props.schema as unknown as Zod3Type, undefined)
    });

    return form;
};