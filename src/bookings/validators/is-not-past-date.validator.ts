import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotPastDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;

          const inputDate = new Date(value);
          if (isNaN(inputDate.getTime())) return false; 
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          return inputDate >= startOfToday;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Booking date cannot be in the past';
        },
      },
    });
  };
}