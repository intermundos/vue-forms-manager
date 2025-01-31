import { expect, test } from 'bun:test';
import { FormManager } from './vue-form-manager';

test('useValidate', () => {
  const data = {
    name: 'John Doe',
    email: '',
  };

  const rules = {
    name: [
      {
        name: 'required',
        message: 'Name is required',
        test: (value: string) => !!value,
      },
    ],
    email: [
      {
        name: 'required',
        message: 'Email is required',
        test: (value: string) => !!value,
      },
      {
        name: 'email',
        message: 'Email is invalid',
        test: (value: string) => /.+@.+\..+/.test(value),
      },
    ],
  };

  const form = new FormManager().buildForm<{
    name: string;
    email: string;
  }>(data, rules);

  expect(form.$form.$invalid).toBe(false);
  expect(Object.keys(form.$fields).length).toBe(Object.keys(data).length);
});
