import type { Page } from '$app/state';

class PageState {
  data = $state.raw<Page['data']>({});
  form = $state.raw<Page['form']>(null);
  error = $state.raw<Page['error']>(null);
  params = $state.raw<Page['params']>({});
  route = $state.raw<Page['route']>({ id: null });
  state = $state.raw<Page['state']>({});
  status = $state.raw(-1);
  url = $state.raw(new URL('http://localhost/'));
}

const current = new PageState();

export const setPage = (next: Partial<PageState>) => {
  Object.assign(current, next);
};

export const resetPage = () => {
  Object.assign(current, new PageState());
};

export const page = {
  get data() {
    return current.data;
  },
  get form() {
    return current.form;
  },
  get error() {
    return current.error;
  },
  get params() {
    return current.params;
  },
  get route() {
    return current.route;
  },
  get state() {
    return current.state;
  },
  get status() {
    return current.status;
  },
  get url() {
    return current.url;
  },
};

export const navigating = {
  from: null,
  to: null,
  type: null,
  willUnload: null,
  delta: null,
  complete: null,
};

export const updated = {
  current: false,
  check: () => Promise.resolve(false),
};
