/** Client half: a「用户插件」tab in the settings Plugins section, styled after the market's「已安装」cards. */

window.__ModuleLoader__.load({
  id: 'dsh-destinywind-userplugins',
  factory(require) {
    const React = require('react');
    const { Switch, Tag, Button, Modal, StateDot } = require('@deepseek-ai/dsh-client-ui-primitives');

    const SLOT_NAME = 'settings.plugins.tab';
    const ENTRY_ID = 'destinywind-userplugins';
    const SLOT_ORDER = 20;

    /** Built-in profile bundles never show as user plugins (same set as the market page). */
    const BUILTIN_PROFILE_BUNDLES = new Set([
      '@deepseek-ai/dsh-base',
      '@deepseek-ai/dsh-web-app',
      '@deepseek-ai/dsh-headless',
      '@deepseek-ai/dsh-sdk-app',
      '@deepseek-ai/dsh-acp-app',
      '@deepseek-ai/dsh-sdk-minimal',
    ]);

    /** Refusal codes read as sentences (same wording as the market page). */
    const REASONS = {
      'management-required': '需要先启用插件管理',
      'unaddressable': '这个包不受插件管理',
      'unknown-plugin': '未找到这个插件',
      'invalid-spec': '包名无效',
      'ambiguous-install': '这个包名对应多个插件',
      'not-bundle': '这个包不是插件组合包',
      'not-removable': '这个包不属于当前 profile，或者是插件管理所需的组件',
      'stop-profile': '这个 profile 没有启用 HMR，正在使用的包要停止后用 dsh plugin 卸载',
      'bundle-in-use': '这个包正被其他插件依赖',
      'stale-approval': '安装授权已过期',
      'operation-error': '操作失败',
    };

    function reasonText(error) {
      if (!error) return '';
      if (error.code === 'operation-error') return error.diagnostic || REASONS['operation-error'];
      return REASONS[error.code] || error.message || error.diagnostic || String(error.code);
    }

    /** Compact a package name to what a person reads. */
    function shortName(name) {
      const unscoped = name.startsWith('@') ? name.slice(name.indexOf('/') + 1) : name;
      return unscoped.replace(/^dsh-(?:host-|client-)?/, '');
    }

    /** Card icon: manifest icon when it decodes, a letter tile otherwise. */
    function PackageArtwork({ src, name }) {
      const [failed, setFailed] = React.useState(false);
      const letter = (shortName(name)[0] || '?').toUpperCase();
      if (src && !failed) {
        return React.createElement('img', {
          src, width: 36, height: 36, alt: '', style: { objectFit: 'contain' },
          onError: () => setFailed(true),
        });
      }
      return React.createElement('span', {
        style: {
          width: 36, height: 36, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--dsw-alias-bg-layer-3, rgba(128,128,128,0.12))', fontSize: 16, fontWeight: 600,
          color: 'var(--dsw-alias-label-secondary, inherit)',
        },
      }, letter);
    }

    /** One page style block; classes mirror the market page's CSS module. */
    function PageStyles() {
      const css = `
.dshup-cards { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; }
.dshup-card { min-width: 0; margin: 0 -8px; border-radius: 12px; }
.dshup-card:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.08)); }
.dshup-cardHead { display: flex; align-items: center; gap: 14px; padding: 8px; }
.dshup-cardIcon { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 48px; height: 48px; border: 0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.3)); border-radius: 10px; color: var(--dsw-alias-label-secondary, inherit); }
.dshup-cardMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.dshup-titleRow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
.dshup-cardTitle { font-size: 14px; line-height: 20px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshup-cardDesc { font-size: 13px; line-height: 18px; color: var(--dsw-alias-label-tertiary, rgba(128,128,128,0.8)); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
.dshup-cardEnd { display: inline-flex; flex: none; align-items: center; gap: 8px; }
.dshup-statusTag { height: 18px; padding: 0 7px; font-size: 10px; line-height: 1; }
.dshup-versionTag { flex: none; font-variant-numeric: tabular-nums; font-size: 11px; line-height: 18px; color: var(--dsw-alias-label-caption, rgba(128,128,128,0.6)); }
.dshup-metaError { margin: 0 8px 8px 70px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-error-primary, #c0392b); overflow-wrap: anywhere; }
.dshup-status, .dshup-empty { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-tertiary, rgba(128,128,128,0.8)); }
.dshup-statusWithDot { display: inline-flex; align-items: center; gap: 6px; }
.dshup-failure { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-state-error-primary, #c0392b); overflow-wrap: anywhere; }
.dshup-notice { margin: 0; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-primary, inherit); }
.dshup-danger { color: var(--dsw-alias-state-error-primary, #c0392b); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #c0392b) 30%, transparent); --dsw-alias-interactive-bg-hover: color-mix(in srgb, var(--dsw-alias-state-error-primary, #c0392b) 8%, transparent); }
.dshup-dangerButton { --dsw-alias-button-primary-fill: var(--dsw-alias-state-error-primary, #c0392b); --dsw-alias-button-primary-hover: var(--dsw-alias-state-error-primary, #c0392b); }
.dshup-group { display: flex; flex-direction: column; gap: 8px; }
.dshup-groupHead { display: flex; align-items: baseline; gap: 8px; }
.dshup-groupTitle { margin: 0; font-size: 14px; line-height: 22px; font-weight: 500; }
.dshup-count { font-size: 14px; color: var(--dsw-alias-label-caption, rgba(128,128,128,0.6)); font-variant-numeric: tabular-nums; }
`;
      return React.createElement('style', null, css);
    }

    /**
     * The「用户插件」tab. Props: `t`/`ensure`/`refresh`/`resolveText` from the
     * injected face; the useX hooks are uSES-compat snapshot sources.
     */
    function UserPluginsTab(props) {
      const { resolveText, usePackages, actions } = props;
      const state = usePackages(snapshot => snapshot);

      React.useEffect(() => { actions.ensure(); }, [actions]);

      if (state.status === 'idle' || state.status === 'loading') {
        return React.createElement('div', null,
          React.createElement(PageStyles),
          React.createElement('p', { className: 'dshup-status dshup-statusWithDot', role: 'status' },
            React.createElement(StateDot, { state: 'ongoing' }), '正在读取插件…'));
      }

      if (state.status === 'unavailable') {
        return React.createElement('div', null,
          React.createElement(PageStyles),
          React.createElement('p', { className: 'dshup-status' }, '本部署没有可管理的 profile，无法安装或启停插件。'));
      }

      if (state.status === 'error') {
        return React.createElement('div', null,
          React.createElement(PageStyles),
          React.createElement('p', { className: 'dshup-failure' }, state.message || '可能由于网络问题，无法读取全部插件'));
      }

      // The market's「已安装」semantics: not a built-in profile bundle, and
      // installed, or shipped-for-switching, or an unreadable package.
      const listed = state.packages.filter(pkg => !BUILTIN_PROFILE_BUNDLES.has(pkg.name)
        && (pkg.installed || !pkg.optional || pkg.error !== undefined));
      const mine = listed.filter(pkg => pkg.installed || !pkg.optional);

      const packageCard = (pkg) => {
        const title = pkg.meta && pkg.meta.title !== undefined ? resolveText(pkg.meta.title) : pkg.name;
        const description = pkg.meta && pkg.meta.description !== undefined
          ? (resolveText(pkg.meta.description) || undefined)
          : undefined;
        const status = pkg.error !== undefined ? 'problem' : (pkg.enabled ? 'running' : 'disabled');
        const busy = state.busy.includes(pkg.name);
        return React.createElement('li', {
          key: pkg.name,
          className: 'dshup-card',
          'data-plugin-package': pkg.name,
          'data-plugin-status': status,
        },
          React.createElement('div', { className: 'dshup-cardHead' },
            React.createElement('span', { className: 'dshup-cardIcon', 'aria-hidden': 'true' },
              React.createElement(PackageArtwork, { src: pkg.meta && pkg.meta.icon, name: pkg.name })),
            React.createElement('div', { className: 'dshup-cardMain' },
              React.createElement('div', { className: 'dshup-titleRow' },
                React.createElement('span', { className: 'dshup-cardTitle', title: pkg.name }, title),
                pkg.version ? React.createElement('span', { className: 'dshup-versionTag' }, `v${pkg.version}`) : null,
                pkg.error !== undefined ? React.createElement(Tag, { className: 'dshup-statusTag', tone: 'danger' }, '异常') : null),
              description === undefined ? null : React.createElement('span', { className: 'dshup-cardDesc' }, description)),
            React.createElement('div', { className: 'dshup-cardEnd' },
              React.createElement(Button, {
                variant: 'outline', size: 'sm',
                onClick: () => actions.showDetail({
                  title,
                  description,
                }),
              }, '详情'),
              React.createElement(Button, {
                variant: 'outline', size: 'sm', className: 'dshup-danger',
                disabled: busy || !pkg.installed,
                title: pkg.installed ? `卸载 ${title}` : '这个包不能卸载',
                onClick: () => actions.requestUninstall(pkg),
              }, '卸载'),
              React.createElement(Switch, {
                checked: pkg.enabled,
                label: `启用 ${title}`,
                disabled: busy || pkg.readOnlyReason !== undefined || (!pkg.enabled && pkg.error !== undefined),
                title: pkg.readOnlyReason !== undefined ? reasonText({ code: pkg.readOnlyReason }) : undefined,
                onChange: enabled => actions.setEnabled(pkg.name, enabled),
              }))),
          pkg.meta && pkg.meta.error
            ? React.createElement('p', { className: 'dshup-metaError', 'data-package-meta-error': true }, `包元信息错误：${pkg.meta.error}`)
            : null);
      };

      return React.createElement('div', null,
        React.createElement(PageStyles),
        mine.length === 0
          ? React.createElement('p', { className: 'dshup-empty' }, '还没有安装任何用户插件；在侧边栏「插件」页可以添加。')
          : React.createElement('section', { className: 'dshup-group', 'data-plugin-scope': 'global', 'data-plugin-group': 'bundles' },
              React.createElement('div', { className: 'dshup-groupHead' },
                React.createElement('h3', { className: 'dshup-groupTitle' }, '已安装'),
                React.createElement('span', { className: 'dshup-count', 'data-plugin-count': mine.length }, mine.length)),
              React.createElement('ul', { className: 'dshup-cards' }, mine.map(packageCard))),
        state.notice !== null
          ? React.createElement('p', { className: 'dshup-notice', role: 'status' }, noticeLine(state.notice))
          : null,
        state.confirm !== null
          ? React.createElement(ConfirmUninstall, { name: state.confirm.packageName, actions })
          : null,
        state.detail !== null
          ? React.createElement(DetailModal, { detail: state.detail, onClose: actions.closeDetail })
          : null);
    }

    /** The market's uninstall confirmation, same wording. */
    function ConfirmUninstall({ name, actions }) {
      return React.createElement(Modal, {
        open: true,
        onClose: actions.cancelConfirm,
        title: `卸载「${name}」？`,
        closeLabel: '关闭',
        description: '卸载后它提供的功能会消失。',
        footer: React.createElement(React.Fragment, null,
          React.createElement(Button, { variant: 'outline', onClick: actions.cancelConfirm }, '取消'),
          React.createElement(Button, { variant: 'primary', className: 'dshup-dangerButton', onClick: actions.confirm }, '卸载')),
      });
    }

    /** The detail dialog: title and the plugin's description, nothing else. */
    function DetailModal({ detail, onClose }) {
      return React.createElement(Modal, {
        open: true,
        onClose,
        title: detail.title,
        closeLabel: '关闭',
        description: detail.description || '这个插件没有提供说明。',
      });
    }

    /** What a change's outcome says in passing. */
    function noticeLine(notice) {
      if (notice.kind === 'restart') return '更改将在下次启动生效';
      if (notice.kind === 'overridden') return `${notice.packageName} 已保存，但被更高优先级的配置覆盖，当前未生效`;
      const reason = notice.reason && notice.reason !== '' ? notice.reason : '操作失败';
      if (notice.action === 'enable') return `启用失败：${reason}`;
      if (notice.action === 'disable') return `停用失败：${reason}`;
      if (notice.action === 'uninstall') return `卸载失败：${reason}`;
      return reason;
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.pluginManager', 'remote.pluginInventory'],
      apply(ctx) {
        // One snapshot store backing the tab: status, packages, busy keys, notice, confirm.
        const { createSnapshotStore } = require('@deepseek-ai/dsh-client-store');
        const store = createSnapshotStore({
          status: 'idle', packages: [], busy: [], notice: null, confirm: null, detail: null, message: '',
        });
        let disposed = false;
        let pendingConfirm = null;

        const patch = (next) => {
          if (disposed) return;
          store.set({ ...store.getSnapshot(), ...next });
        };

        const inventoryOk = async () => {
          const inventory = await ctx.remote.pluginInventory.list();
          return inventory.ok && inventory.value.managementAvailable === true;
        };

        async function load() {
          if (disposed) return;
          try {
            if (!(await inventoryOk())) {
              patch({ status: 'unavailable', packages: [] });
              return;
            }
            const bundles = await ctx.remote.pluginManager.listBundles();
            if (disposed) return;
            if (!bundles.ok) {
              patch({ status: 'error' });
              return;
            }
            const packages = bundles.value.map(bundle => ({
              name: bundle.name,
              installed: bundle.installed,
              optional: bundle.optional,
              enabled: bundle.enabled,
              readOnlyReason: bundle.readOnlyReason,
              error: bundle.error,
              version: bundle.version,
              description: bundle.description,
              meta: bundle.meta,
            })).sort((a, b) => shortName(a.name).localeCompare(shortName(b.name)));
            patch({ status: 'ready', packages, message: '' });
          } catch (error) {
            if (!disposed) patch({ status: 'error', message: String((error && error.message) || error) });
          }
        }

        /** Run one action under a busy key; failures become the notice line. */
        async function run(key, subject, action) {
          if (disposed || store.getSnapshot().busy.includes(key)) return;
          patch({ busy: [...store.getSnapshot().busy, key], notice: null });
          try {
            await action();
          } catch (error) {
            patch({ notice: { action: subject.action, reason: String((error && error.message) || error) } });
          } finally {
            patch({ busy: store.getSnapshot().busy.filter(entry => entry !== key) });
          }
          await load();
        }

        /** Publish a change's outcome the way the market page does. */
        function applied(answer, packageName) {
          if (!answer.ok) throw new Error(answer.error.message);
          const result = answer.value;
          if (result.application === 'failed') {
            throw new Error((result.error && (result.error.diagnostic || REASONS[result.error.code])) || '操作失败');
          }
          if (result.application === 'restart-required') patch({ notice: { kind: 'restart' } });
          if (result.application === 'overridden') patch({ notice: { kind: 'overridden', packageName } });
        }

        const actions = {
          ensure: () => { if (store.getSnapshot().status === 'idle') void load(); },
          setEnabled: (name, enabled) => {
            void run(name, { action: enabled ? 'enable' : 'disable' }, async () => {
              applied(await ctx.remote.pluginManager.setBundleEnabled(name, enabled), name);
            });
          },
          requestUninstall: (pkg) => {
            pendingConfirm = () => run(pkg.name, { action: 'uninstall' }, async () => {
              applied(await ctx.remote.pluginManager.removeBundle(pkg.name), pkg.name);
            });
            patch({ confirm: { action: 'uninstall', packageName: pkg.name } });
          },
          confirm: () => {
            const pending = pendingConfirm;
            pendingConfirm = null;
            patch({ confirm: null });
            if (pending) void pending();
          },
          cancelConfirm: () => { pendingConfirm = null; patch({ confirm: null }); },
          showDetail: detail => patch({ detail }),
          closeDetail: () => patch({ detail: null }),
        };

        const usePackages = (selector) => React.useSyncExternalStore(
          store.subscribe,
          selector === undefined ? store.getSnapshot : () => selector(store.getSnapshot()),
        );

        const resolveText = text => ctx.locale.resolveText(text);

        ctx.effect(() => {
          // The Host says when what is installed, enabled, or composed changed.
          const disposers = [
            ctx.remote.$on('plugin-manager/changed', () => { void load(); }),
            ctx.on('connection/reset', () => { void load(); }),
          ];
          return () => {
            disposed = true;
            for (const dispose of disposers) dispose();
          };
        }, 'dsh-destinywind-userplugins: host invalidations');

        ctx.slots.inject(SLOT_NAME, () => ctx.slots.register({
          name: SLOT_NAME,
          id: ENTRY_ID,
          order: SLOT_ORDER,
          label: '用户插件',
          inject: () => ({ resolveText, usePackages, actions }),
        }, UserPluginsTab));
      },
    };
  },
});
