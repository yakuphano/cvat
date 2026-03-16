// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router';
import Modal from 'antd/lib/modal';
import Dropdown from 'antd/lib/dropdown';
import Button from 'antd/lib/button';
import message from 'antd/lib/message';
import Icon from '@ant-design/icons';
import { MenuProps } from 'antd/lib/menu';

import { MainMenuIcon } from 'icons';
import { Job, JobState } from 'cvat-core-wrapper';
import { CombinedState } from 'reducers';
import { finishCurrentJobAsync } from 'actions/annotation-actions';
import { exportActions } from 'actions/export-actions';
import { importActions } from 'actions/import-actions';

export enum Actions {
    LOAD_JOB_ANNO = 'load_job_anno',
    EXPORT_JOB_DATASET = 'export_job_dataset',
    OPEN_TASK = 'open_task',
    FINISH_JOB = 'finish_job',
}

function AnnotationMenuComponent(): JSX.Element {
    const dispatch = useDispatch();
    const history = useHistory();
    const jobInstance = useSelector((state: CombinedState) => state.annotation.job.instance as Job);
    const user = useSelector((state: CombinedState) => state.auth.user);

    const finishJob = useCallback(() => {
        dispatch(finishCurrentJobAsync(() => {
            message.success('Job marked as completed');
        }));
    }, [dispatch]);

    const openTask = useCallback(() => {
        history.push(`/tasks/${jobInstance.taskId}`);
    }, [history, jobInstance.taskId]);

    const menuItems: [NonNullable<MenuProps['items']>[0], number][] = [];

    // --- SADECE ADMIN (STAFF) İÇİN GÖRÜNECEK ÖZELLİKLER ---
    if (user.isStaff) {
        menuItems.push([{
            key: Actions.LOAD_JOB_ANNO,
            label: 'Upload annotations',
            onClick: () => dispatch(importActions.openImportDatasetModal(jobInstance)),
        }, 10]);

        menuItems.push([{
            key: Actions.EXPORT_JOB_DATASET,
            label: 'Export job dataset',
            onClick: () => dispatch(exportActions.openExportDatasetModal(jobInstance)),
        }, 20]);
    }

    // --- HERKES (WORKER DAHİL) İÇİN GÖRÜNECEK ÖZELLİKLER ---
    menuItems.push([{
        key: Actions.OPEN_TASK,
        label: 'Back to Task',
        onClick: openTask,
    }, 50]);

    menuItems.push([{
        key: Actions.FINISH_JOB,
        label: (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                Finish the job
            </span>
        ),
        onClick: () => {
            Modal.confirm({
                title: 'Finish the job?',
                content: 'This will save your work and mark it as completed.',
                okText: 'Finish',
                cancelText: 'Cancel',
                onOk: finishJob,
            });
        },
    }, 70]);

    const finalMenuItems = menuItems
        .sort((a, b) => a[1] - b[1])
        .map((item) => item[0]);

    return (
        <Dropdown
            trigger={['click']}
            destroyPopupOnHide
            menu={{
                items: finalMenuItems,
                triggerSubMenuAction: 'click',
                className: 'cvat-annotation-menu',
            }}
        >
            <Button type='link' className='cvat-annotation-header-menu-button cvat-annotation-header-button'>
                <Icon component={MainMenuIcon} />
                Menu
            </Button>
        </Dropdown>
    );
}

export default React.memo(AnnotationMenuComponent);