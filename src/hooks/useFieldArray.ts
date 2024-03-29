import React from "react";

import {
    Control,
    FieldArray,
    FieldArrayMethodProps,
    FieldArrayPath,
    FieldArrayWithId,
    FieldPath,
    FieldValues,
    InternalFieldName,
    RegisterOptions,
    UseFieldArrayAppend,
    UseFieldArrayProps,
    useFormContext,
} from "react-hook-form";

import {
    get,
    isUndefined,
    isPlainObject,
    isObject,
    compact,
    isString,
} from "lodash";

import { Subject } from "react-hook-form/dist/utils/createSubject";

function generateGUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

export function updateAt<T>(fieldValues: T[], index: number, value: T) {
    fieldValues[index] = value;
    return fieldValues;
}
export const isWeb =
    typeof window !== "undefined" &&
    typeof window.HTMLElement !== "undefined" &&
    typeof document !== "undefined";
export function cloneObject<T>(data: T): T {
    let copy: any;
    const isArray = Array.isArray(data);

    if (data instanceof Date) {
        copy = new Date(data);
    } else if (data instanceof Set) {
        copy = new Set(data);
    } else if (
        !(isWeb && (data instanceof Blob || data instanceof FileList)) &&
        (isArray || isObject(data))
    ) {
        copy = isArray ? [] : {};

        if (!isArray && !isPlainObject(data)) {
            copy = data;
        } else {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    copy[key] = cloneObject(data[key]);
                }
            }
        }
    } else {
        return data;
    }

    return copy;
}

export function convertToArrayPayload<T>(value: T) {
    return Array.isArray(value) ? value : [value];
}

export function appendAt<T>(data: T[], value: T | T[]): T[] {
    return [...data, ...convertToArrayPayload(value)];
}

export function fillEmptyArray<T>(value: T | T[]): undefined[] | undefined {
    return Array.isArray(value) ? value.map(() => undefined) : undefined;
}
export const getFocusFieldName = (
    name: InternalFieldName,
    index: number,
    options: FieldArrayMethodProps = {}
): string =>
    options.shouldFocus || isUndefined(options.shouldFocus)
        ? options.focusName ||
          `${name}.${
              isUndefined(options.focusIndex) ? index : options.focusIndex
          }.`
        : "";

type Props<T> = {
    disabled?: boolean;
    subject: Subject<T>;
    next: (value: T) => void;
};

export function useSubscribe<T>(props: Props<T>) {
    const _props = React.useRef(props);
    _props.current = props;

    React.useEffect(() => {
        const subscription =
            !props.disabled &&
            _props.current.subject &&
            _props.current.subject.subscribe({
                next: _props.current.next,
            });

        return () => {
            subscription && subscription.unsubscribe();
        };
    }, [props.disabled]);
}

function removeAtIndexes<T>(data: T[], indexes: number[]): T[] {
    let i = 0;
    const temp = [...data];

    for (const index of indexes) {
        temp.splice(index - i, 1);
        i++;
    }

    return compact(temp).length ? temp : [];
}

export function removeArrayAt<T>(data: T[], index?: number | number[]): T[] {
    return isUndefined(index)
        ? []
        : removeAtIndexes(
              data,
              (convertToArrayPayload(index) as number[]).sort((a, b) => a - b)
          );
}

type rowId = number | string;
type UseFieldArrayUpdate<
    TFieldValues extends FieldValues,
    TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>
> = (index: rowId, value: FieldArray<TFieldValues, TFieldArrayName>) => void;
type UseFieldArrayRemove = (index?: number | number[]) => void;
export type UseFieldArrayReturn<
    TFieldValues extends FieldValues = FieldValues,
    TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
    TKeyName extends string = "$guid"
> = {
    append: UseFieldArrayAppend<TFieldValues, TFieldArrayName>;
    remove: UseFieldArrayRemove;
    update: UseFieldArrayUpdate<TFieldValues, TFieldArrayName>;
    fields: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[];
};

export function useFieldArray<
    TFieldValues extends FieldValues = FieldValues,
    TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
    TKeyName extends string = "$guid"
>(
    props: UseFieldArrayProps<TFieldValues, TFieldArrayName, TKeyName> & {
        mumberOfVirtualRow?: number;
    }
): UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName> {
    const methods = useFormContext();
    const {
        control = methods.control,
        name,
        keyName = "$guid",
        shouldUnregister,
        mumberOfVirtualRow = 1,
    } = props;
    const [fields, setFields] = React.useState(control._getFieldArray(name));

    const _fieldIds = React.useRef(fields);
    const _name = React.useRef(name);
    const _actioned = React.useRef(false);
    const ids = React.useRef<string[]>([]); //  control._getFieldArray(name).map(generateGUID)
    _name.current = name;
    _fieldIds.current = fields;
    control._names.array.add(name);

    props.rules &&
        (control as Control<TFieldValues>).register(
            name as FieldPath<TFieldValues>,
            props.rules as RegisterOptions<TFieldValues>
        );

    useSubscribe({
        next: ({
            values,
            name: fieldArrayName,
        }: {
            values?: FieldValues;
            name?: InternalFieldName;
        }) => {
            if (fieldArrayName === _name.current || !fieldArrayName) {
                const fieldValues = get(values, _name.current);
                if (Array.isArray(fieldValues)) {
                    setFields(fieldValues);
                }
            }
        },
        subject: control._subjects.array,
    });

    const append = (
        value:
            | Partial<FieldArray<TFieldValues, TFieldArrayName>>
            | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
        options?: FieldArrayMethodProps
    ) => {
        const appendValue = convertToArrayPayload(cloneObject(value));
        const updatedFieldArrayValues = appendAt(
            control._getFieldArray(name),
            appendValue
        );
        control._names.focus = getFocusFieldName(
            name,
            updatedFieldArrayValues.length - 1,
            options
        );
        ids.current = appendAt(ids.current, appendValue.map(generateGUID));
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, appendAt, {
            argA: fillEmptyArray(value),
        });
    };

    const updateValues = React.useCallback(
        <
            T extends Partial<
                FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
            >[]
        >(
            updatedFieldArrayValues: T
        ) => {
            _actioned.current = true;
            control._updateFieldArray(name, updatedFieldArrayValues);
        },
        [control, name]
    );

    const update = (
        index: rowId,
        value: FieldArray<TFieldValues, TFieldArrayName>
    ) => {
        index = isString(index) ? getRowIndexByKey(index) : index;
        const updateValue = cloneObject(value);
        const updatedFieldArrayValues = updateAt(
            control._getFieldArray<
                FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
            >(name),
            index,
            updateValue as FieldArrayWithId<
                TFieldValues,
                TFieldArrayName,
                TKeyName
            >
        );
        const idIndex = ids.current[index];
        if (!idIndex) {
            ids.current = [...updatedFieldArrayValues].map((item, i) =>
                !item || i === index ? generateGUID() : ids.current[i]
            );
        }
        updateValues(updatedFieldArrayValues);
        setFields([...updatedFieldArrayValues]);
        control._updateFieldArray(
            name,
            updatedFieldArrayValues,
            updateAt,
            {
                argA: index,
                argB: updateValue,
            },
            true,
            false
        );
    };

    const remove = (index?: number | number[]) => {
        const updatedFieldArrayValues: Partial<
            FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
        >[] = removeArrayAt(control._getFieldArray(name), index);
        ids.current = removeArrayAt(ids.current, index);
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(
            name,
            updatedFieldArrayValues,
            removeArrayAt,
            {
                argA: index,
            }
        );
    };

    const getRowIndexByKey = (id: string) => {
        return ids.current.findIndex((rowId) => rowId == id);
    };

    React.useEffect(() => {
        !get(control._formValues, name) && control._updateFieldArray(name);

        return () => {
            (control._options.shouldUnregister || shouldUnregister) &&
                control.unregister(name as FieldPath<TFieldValues>);
        };
    }, [name, control, keyName, shouldUnregister]);

    return {
        append: React.useCallback(append, [updateValues, name, control]),
        remove: React.useCallback(remove, [updateValues, name, control]),
        update: React.useCallback(update, [updateValues, name, control]),
        fields: React.useMemo(
            () =>
                fields
                    .concat(
                        Array.from({ length: mumberOfVirtualRow }, () => ({
                            $isVirtual: true,
                        }))
                    )
                    .map((field, index) => {
                        const prevId = ids.current[index];

                        if (!prevId) {
                            ids.current[index] =
                                get(field, keyName) || generateGUID();
                        }
                        return {
                            ...field,
                            [keyName]: ids.current[index],
                        } as FieldArrayWithId<
                            TFieldValues,
                            TFieldArrayName,
                            TKeyName
                        >[];
                    }),
            [fields, keyName]
        ) as any,
    };
}
