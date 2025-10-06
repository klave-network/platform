import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps, Resolver } from 'react-hook-form';
import { z } from 'zod';

export const useZodForm = <TSchema extends z.ZodObject>(props: {
    schema: TSchema;
} & Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>) => {

    const form = useForm({
        ...props,
        resolver: zodResolver(props.schema) as Resolver<z.infer<TSchema>, unknown, z.infer<TSchema>>
    });

    return form;
};
