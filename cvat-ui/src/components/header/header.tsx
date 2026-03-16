// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import { MenuProps } from 'antd/lib/menu';
import {
    SettingOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
    LogoutOutlined,
    CaretDownOutlined,
    ControlOutlined,
    UserOutlined,
    TeamOutlined,
    PlusOutlined,
    MailOutlined,
} from '@ant-design/icons';
import Layout from 'antd/lib/layout';
import Button from 'antd/lib/button';
import Dropdown from 'antd/lib/dropdown';
import Modal from 'antd/lib/modal';
import Text from 'antd/lib/typography/Text';

import config from 'config';

import { Organization } from 'cvat-core-wrapper';
import CVATLogo from 'components/common/cvat-logo';
import { switchSettingsModalVisible as switchSettingsModalVisibleAction } from 'actions/settings-actions';
import { logoutAsync } from 'actions/auth-actions';
import { shortcutsActions, registerComponentShortcuts } from 'actions/shortcuts-actions';
import { getOrganizationsAsync, organizationActions } from 'actions/organization-actions';
import { AboutState, CombinedState } from 'reducers';
import { useIsMounted, usePlugins } from 'utils/hooks';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import { ShortcutScope } from 'utils/enums';
import { subKeyMap } from 'utils/component-subkeymap';
import SettingsModal from './settings-modal/settings-modal';

interface StateToProps {
    user: any;
    about: AboutState;
    keyMap: KeyMap;
    switchSettingsShortcut: string;
    settingsModalVisible: boolean;
    shortcutsModalVisible: boolean;
    changePasswordDialogShown: boolean;
    logoutFetching: boolean;
    isAnalyticsPluginActive: boolean;
    organizationFetching: boolean;
    currentOrganization: any | null;
    organizationsList: Organization[];
    organizationsListFetching: boolean;
    organizationsListSearch: string;
    organizationsListPage: number;
}

interface DispatchToProps {
    onLogout: () => void;
    switchSettingsModalVisible: (visible: boolean) => void;
    switchShortcutsModalVisible: (visible: boolean) => void;
    fetchOrganizations: () => void;
    openSelectOrganizationModal: (onSelectOrgCallback: (org: Organization | null) => void) => void;
}

const componentShortcuts = {
    SWITCH_SHORTCUTS: {
        name: 'Show shortcuts',
        description: 'Open/hide the list of available shortcuts',
        sequences: ['f1'],
        scope: ShortcutScope.GENERAL,
    },
    SWITCH_SETTINGS: {
        name: 'Show settings',
        description: 'Open/hide settings dialog',
        sequences: ['f2'],
        scope: ShortcutScope.GENERAL,
    },
};

registerComponentShortcuts(componentShortcuts);

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        auth: {
            user,
            fetching: logoutFetching,
            showChangePasswordDialog: changePasswordDialogShown,
        },
        plugins: { list },
        about,
        shortcuts: { normalizedKeyMap, keyMap, visibleShortcutsHelp: shortcutsModalVisible },
        settings: { showDialog: settingsModalVisible },
        organizations: {
            fetching: organizationFetching,
            current: currentOrganization,
            currentArray: organizationsList,
            currentArrayFetching: organizationsListFetching,
            gettingQuery: {
                search: organizationsListSearch,
                page: organizationsListPage,
            },
        },
    } = state;

    return {
        user,
        about,
        switchSettingsShortcut: normalizedKeyMap.SWITCH_SETTINGS,
        keyMap,
        settingsModalVisible,
        shortcutsModalVisible,
        changePasswordDialogShown,
        logoutFetching,
        isAnalyticsPluginActive: list.ANALYTICS,
        organizationFetching,
        currentOrganization,
        organizationsList,
        organizationsListFetching,
        organizationsListSearch,
        organizationsListPage,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onLogout: (): void => dispatch(logoutAsync()),
        switchShortcutsModalVisible: (visible: boolean): void => dispatch(
            shortcutsActions.switchShortcutsModalVisible(visible),
        ),
        switchSettingsModalVisible: (visible: boolean): void => dispatch(
            switchSettingsModalVisibleAction(visible),
        ),
        fetchOrganizations: (): void => dispatch(
            getOrganizationsAsync({}),
        ),
        openSelectOrganizationModal: (
            onSelectOrgCallback: (org: Organization | null) => void,
        ): void => dispatch(
            organizationActions.openSelectOrganizationModal(onSelectOrgCallback),
        ),
    };
}

type Props = StateToProps & DispatchToProps;

function HeaderComponent(props: Props): JSX.Element {
    const {
        user,
        about,
        keyMap,
        logoutFetching,
        settingsModalVisible,
        shortcutsModalVisible,
        switchSettingsShortcut,
        organizationFetching,
        currentOrganization,
        organizationsList,
        organizationsListFetching,
        organizationsListSearch,
        organizationsListPage,
        switchSettingsModalVisible,
        switchShortcutsModalVisible,
        fetchOrganizations,
        openSelectOrganizationModal,
    } = props;

    const {
        CHANGELOG_URL, LICENSE_URL, DISCORD_URL,
    } = config;

    const isMounted = useIsMounted();

    useEffect(() => {
        if (isMounted()) {
            fetchOrganizations();
        }
    }, []);

    const history = useHistory();
    const location = useLocation();

    const handlers: Record<keyof typeof componentShortcuts, (event?: KeyboardEvent) => void> = {
        SWITCH_SHORTCUTS: (event: KeyboardEvent | undefined) => {
            if (event) event.preventDefault();
            if (!settingsModalVisible) {
                switchShortcutsModalVisible(!shortcutsModalVisible);
            }
        },
        SWITCH_SETTINGS: (event: KeyboardEvent | undefined) => {
            if (event) event.preventDefault();
            if (!shortcutsModalVisible) {
                switchSettingsModalVisible(!settingsModalVisible);
            }
        },
    };

    const aboutLinks: [JSX.Element, number][] = [];
    aboutLinks.push([(
        <Col key='license'>
            <a href={LICENSE_URL} target='_blank' rel='noopener noreferrer'>
                MIT License
            </a>
        </Col>
    ), 10]);

    const showAboutModal = useCallback((): void => {
        Modal.info({
            title: `${about.server.name}`,
            content: (
                <div>
                    <p>{`${about.server.description}`}</p>
                    <p>
                        <Text strong>Server version:</Text>
                        <Text type='secondary'>{` ${about.server.version}`}</Text>
                    </p>
                    <Row justify='space-around'>
                        { aboutLinks.sort((item1, item2) => item1[1] - item2[1])
                            .map((item) => item[0]) }
                    </Row>
                </div>
            ),
            width: 800,
        });
    }, [about]);

    const closeSettings = useCallback(() => {
        switchSettingsModalVisible(false);
    }, []);

    const resetOrganization = (): void => {
        localStorage.removeItem('currentOrganization');
        window.location.reload();
    };

    const setNewOrganization = (organization: Organization | null): void => {
        if (currentOrganization && !organization) {
            resetOrganization();
        } else if (organization && (!currentOrganization || currentOrganization.slug !== organization.slug)) {
            localStorage.setItem('currentOrganization', organization.slug);
            window.location.reload();
        }
    };

    const plugins = usePlugins((state: CombinedState) => state.plugins.components.header.userMenu.items, props);

    const menuItems: [NonNullable<MenuProps['items']>[0], number][] = [];
    if (user.isStaff) {
        menuItems.push([{
            key: 'admin_page',
            icon: <ControlOutlined />,
            onClick: (): void => {
                window.open('/admin', '_blank');
            },
            label: 'Admin page',
        }, 0]);
    }

    menuItems.push([{
        key: 'profile',
        icon: <UserOutlined />,
        onClick: (): void => {
            history.push('/profile');
        },
        label: 'Profile',
    }, 10]);

    const viewType: 'menu' | 'list' = (organizationsList?.length || 0) > 5 ? 'list' : 'menu';

    menuItems.push([{
        key: 'organization',
        icon: organizationFetching || organizationsListFetching ? <LoadingOutlined /> : <TeamOutlined />,
        label: 'Organization',
        disabled: organizationFetching || organizationsListFetching,
        children: [
            ...(currentOrganization ? [{
                key: 'open_organization',
                icon: <SettingOutlined />,
                label: 'Settings',
                className: 'cvat-header-menu-open-organization',
                onClick: () => history.push('/organization'),
            }] : []), {
                key: 'create_organization',
                icon: <PlusOutlined />,
                label: 'Create',
                className: 'cvat-header-menu-create-organization',
                onClick: () => history.push('/organizations/create'),
            },
            ...(!!organizationsList && viewType === 'menu' ? [{
                key: '$personal',
                label: 'Personal workspace',
                className: !currentOrganization ? 'cvat-header-menu-active-organization-item' : 'cvat-header-menu-organization-item',
                onClick: resetOrganization,
            }, ...organizationsList.map((organization: Organization) => ({
                key: organization.slug,
                onClick: () => setNewOrganization(organization),
                className: currentOrganization?.slug === organization.slug ? 'cvat-header-menu-active-organization-item' : 'cvat-header-menu-organization-item',
                label: organization.slug,
            }))] : []),
        ],
    }, 20]);

    menuItems.push([{
        key: 'settings',
        icon: <SettingOutlined />,
        onClick: () => switchSettingsModalVisible(true),
        label: 'Settings',
    }, 30]);

    menuItems.push([{
        key: 'logout',
        icon: logoutFetching ? <LoadingOutlined /> : <LogoutOutlined />,
        onClick: () => history.push('/auth/logout'),
        label: 'Logout',
        disabled: logoutFetching,
    }, 50]);

    const getButtonClassName = (value: string): string => {
        const regex = new RegExp(`${value}$`);
        const baseClass = `cvat-header-${value}-button cvat-header-button`;
        return location.pathname.match(regex) ? `${baseClass} cvat-active-header-button` : baseClass;
    };

    return (
        <Layout.Header className='cvat-header'>
            <GlobalHotKeys keyMap={subKeyMap(componentShortcuts, keyMap)} handlers={handlers} />
            <div className='cvat-left-header'>
                <CVATLogo />
                <Button
                    className={getButtonClassName('projects')}
                    type='link'
                    onClick={() => history.push('/projects')}
                >
                    Projects
                </Button>
                <Button
                    className={getButtonClassName('tasks')}
                    type='link'
                    onClick={() => history.push('/tasks')}
                >
                    Tasks
                </Button>
                <Button
                    className={getButtonClassName('jobs')}
                    type='link'
                    onClick={() => history.push('/jobs')}
                >
                    Jobs
                </Button>
            </div>
            <div className='cvat-right-header'>
                <Dropdown
                    trigger={['click']}
                    destroyPopupOnHide
                    placement='bottomRight'
                    menu={{
                        items: menuItems.sort((menuItem1, menuItem2) => menuItem1[1] - menuItem2[1])
                            .map((menuItem) => menuItem[0]),
                        triggerSubMenuAction: 'click',
                        className: 'cvat-header-menu',
                    }}
                    className='cvat-header-menu-user-dropdown'
                >
                    <span>
                        <UserOutlined className='cvat-header-dropdown-icon' />
                        <Row>
                            <Col span={24}>
                                <Text strong className='cvat-header-menu-user-dropdown-user'>
                                    {user.username}
                                </Text>
                            </Col>
                        </Row>
                        <CaretDownOutlined className='cvat-header-dropdown-icon' />
                    </span>
                </Dropdown>
            </div>
            <SettingsModal visible={settingsModalVisible} onClose={closeSettings} />
        </Layout.Header>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(HeaderComponent));