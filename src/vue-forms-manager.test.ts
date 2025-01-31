import { expect, test } from 'bun:test';
import type { ValidationRules } from './types';
import { FormsManager } from './vue-forms-manager';

interface TestForm {
  name: string;
  address: {
    city: string[];
    code: number;
  };
}

const state: TestForm = {
  name: '',
  address: {
    city: [],
    code: 0,
  },
};

const rules: ValidationRules<TestForm> = {
  name: [
    {
      name: 'required',
      message: 'Name is required',
      test: (value: string) => !!value,
    },
  ],
  address: {
    city: [
      {
        name: 'required',
        message: 'City is required',
        test: (value: string[]) => !!value.length,
      },
    ],
    code: [
      {
        name: 'min',
        message: 'Code should be greater than 1000',
        test: (value: number) => value > 1000,
      },
    ],
  },
};

test('vue-forms-manager: form initialization', () => {
  const form = FormsManager.buildForm(state, rules);

  expect(form.state.name).toBe('');
  expect(form.state.address.city).toEqual([]);
  expect(form.state.address.code).toBe(0);
  expect(form.$form.$invalid).toBe(false);
  expect(form.$form.$dirty).toBe(false);
});

test('vue-forms-manager: field validation', async () => {
  const form = FormsManager.buildForm(state, rules);

  await form.$fields.name.$validate();
  expect(form.$fields.name.$invalid).toBe(true);
  expect(form.$fields.name.$errors[0].message).toBe('Name is required');

  form.$fields.name.$update('John Doe');
  await form.$fields.name.$validate();
  expect(form.$fields.name.$invalid).toBe(false);
  expect(form.$fields.name.$errors.length).toBe(0);
});

test('vue-forms-manager: form methods', async () => {
  const form = FormsManager.buildForm(state, rules);

  form.$form.$touch();
  expect(form.$form.$dirty).toBe(true);
  expect(form.$fields.name.$dirty).toBe(true);
  expect(form.$fields.address.city.$dirty).toBe(true);
  expect(form.$fields.address.code.$dirty).toBe(true);

  form.$form.$reset();
  expect(form.$form.$dirty).toBe(false);
  expect(form.$form.$errors.length).toBe(0);
  expect(form.$fields.name.$dirty).toBe(false);
  expect(form.$fields.address.city.$dirty).toBe(false);
  expect(form.$fields.address.code.$dirty).toBe(false);

  form.$fields.name.$update('');
  await form.$form.$validate();
  expect(form.$form.$invalid).toBe(true);
  expect(form.$form.$errors.length).toBeGreaterThan(0);
  expect(form.$fields.name.$invalid).toBe(true);
  expect(form.$fields.address.code.$invalid).toBe(true);
  expect(form.$fields.address.city.$invalid).toBe(true);
});

test('vue-forms-manager: form options', async () => {
  let form = FormsManager.buildForm(state, rules, {
    lazy: false,
    firstError: true,
  });

  await form.$form.$validate();
  expect(form.$form.$invalid).toBe(true);
  expect(form.$form.$errors.length).toBe(1);

  form = FormsManager.buildForm(state, rules, {
    lazy: true,
    firstError: false,
  });

  await form.$form.$validate();
  expect(form.$form.$invalid).toBe(false);
  expect(form.$form.$errors.length).toBe(0);
});
