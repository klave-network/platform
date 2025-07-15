import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { ZodType } from 'zod';

type Zod3Type<O = unknown, I = unknown> = ZodType<O, I> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _zod: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    '~standard': any
}

export const useZodForm = <T extends FieldValues, C = unknown, V = T>(
    props: UseFormProps<T, C, V> & {
        schema: Zod3Type<unknown, T>
    }
) => {
    const form = useForm<T, C, V>({
        ...props,
        resolver: zodResolver(props.schema)
    });

    return form;
};