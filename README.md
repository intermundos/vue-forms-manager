## `vue-forms-manager`

Vue Forms Manager is a simple form management library for Vue 3.
Developed on Bun.js runtime.

This library is inspired by [vue-tiny-validate](https://github.com/vue-tiny-validate/vue-tiny-validate) and relies
on [vue-demi](https://github.com/antfu/vue-demi).

## Features

1. Simple and lightweight
2. Easy to use
3. Supports async validation
4. Supports validation rules

## Usage

For better experience, it is recommended to use typescript.

### Installation

```bash
npm install vue-forms-manager
yarn add vue-forms-manager
pnpm add vue-forms-manager
bun add vue-forms-manager

// for deno - please verify this.
import { FormsManager } from 'npm:vue-forms-manager';
```

### Usage

```vue

<script setup lang="ts">

  import { FormsManager } from 'vue-forms-manager'

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
        test: ( value: string ) => !!value,
      },
    ],
    address: {
      city: [
        {
          name: 'required',
          message: 'City is required',
          test: ( value: string[] ) => !!value.length,
        },
      ],
      code: [
        {
          name: 'min',
          message: 'Code should be greater than 1000',
          test: ( value: number ) => value > 1000,
        },
      ],
    },
  };

  const { $form, $fields } = FormsManager.buildForm( state, rules );

  async function submit() {
    const valid = await $form.$validate();
    if ( valid ) {
      console.log( 'valid' );
    }
    console.log( 'invalid' );
  }

</script>

<template>
  <form @submit="submit">
    <input v-model="$fields.name.value" type="text" placeholder="Name" />
  </form>
</template>
```

## LICENSE

- [MIT](https://github.com/intermundos/vue-forms-manager/blob/master/LICENSE)
