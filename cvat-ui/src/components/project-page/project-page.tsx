// Copyright (C) 2019-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, {
    useCallback, useEffect, useRef, useState,
} from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import Spin from 'antd/lib/spin';
import { Row, Col } from 'antd/lib/grid';
import Title from 'antd/lib/typography/Title';
import Pagination from 'antd/lib/pagination';
import Empty from 'antd/lib/empty';
import Input from 'antd/lib/input';
import notification from 'antd/lib/notification';

import { getCore, Project, Task } from 'cvat-core-wrapper';
import { CombinedState, TasksQuery, SelectedResourceType } from 'reducers';
import { getProjectTasksAsync, updateProjectAsync } from 'actions/projects-actions';
import CVATLoadingSpinner from 'components/common/loading-spinner';
import TaskItem from 'containers/tasks-page/task-item';
import {
    SortingComponent, ResourceFilterHOC, defaultVisibility, updateHistoryFromQuery,
} from 'components/resource-sorting-filtering';
import { ProjectNotFoundComponent } from 'components/common/not-found';
import BulkWrapper, { BulkSelectProps } from 'components/bulk-wrapper';

import { useResourceQuery } from 'utils/hooks';
import DetailsComponent from './details';
import ProjectTopBar from './top-bar';

import {
    localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues, config,
} from './project-tasks-filter-configuration';

const core = getCore();

const FilteringComponent = ResourceFilterHOC(
    config, localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues,
);

interface ParamType {
    id: string;
}

export default function ProjectPageComponent(): JSX.Element {
    const id = +useParams<ParamType>().id;
    const dispatch = useDispatch();
    const history = useHistory();
    const [projectInstance, setProjectInstance] = useState<Project | null>(null);
    const [fechingProject, setFetchingProject] = useState(true);
    const mounted = useRef(false);

    const {
        user,
        updates,
        tasks,
        tasksCount,
        tasksQuery,
        tasksFetching,
        deletedTasks,
        bulkFetching,
    } = useSelector((state: CombinedState) => ({
        user: state.auth.user,
        updates: state.projects.activities.updates,
        tasks: state.tasks.current,
        tasksCount: state.tasks.count,
        tasksQuery: state.projects.tasksGettingQuery,
        tasksFetching: state.tasks.fetching,
        deletedTasks: state.tasks.activities.deletes,
        bulkFetching: state.bulkActions.fetching,
    }), shallowEqual);

    const [visibility, setVisibility] = useState(defaultVisibility);
    const updatedQuery = useResourceQuery<TasksQuery>(tasksQuery);
    const isProjectUpdating = updates[id];

    useEffect(() => {
        if (Number.isInteger(id)) {
            core.projects.get({ id })
                .then(([project]: Project[]) => {
                    if (project && mounted.current) {
                        dispatch(getProjectTasksAsync({ ...updatedQuery, projectId: id }));
                        setProjectInstance(project);
                    }
                }).catch((error: Error) => {
                    if (mounted.current) {
                        notification.error({
                            message: 'Could not receive the requested project',
                            description: error.toString(),
                        });
                    }
                }).finally(() => {
                    if (mounted.current) setFetchingProject(false);
                });
        }
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        history.replace({ search: updateHistoryFromQuery(tasksQuery) });
    }, [tasksQuery]);

    const onUpdateProject = useCallback((project: Project) => {
        const promise = dispatch(updateProjectAsync(project));
        promise.then((updatedProject: Project) => {
            setProjectInstance(updatedProject);
        });
        return promise;
    }, []);

    if (fechingProject) {
        return <Spin size='large' className='cvat-spinner' />;
    }

    if (!projectInstance) {
        return <ProjectNotFoundComponent />;
    }

    const subsets = Array.from(new Set<string>(tasks.map((task: Task) => task.subset)));
    const projectTaskIDs = tasks.filter((task) => task.projectId === projectInstance.id).map((task) => task.id);
    const selectableProjectTaskIDs = projectTaskIDs.filter((taskId) => !deletedTasks[taskId]);

    function renderTasksForSubset(subset: string, selectProps: (id: number, idx: number) => BulkSelectProps): JSX.Element[] {
        return tasks
            .filter((task) => task.projectId === projectInstance?.id && task.subset === subset)
            .map((task) => (
                <TaskItem
                    key={task.id}
                    taskID={task.id}
                    idx={tasks.indexOf(task)}
                    {...({ selected: false, onClick: () => false })}
                />
            ));
    }

    const content = tasksCount ? (
        <BulkWrapper currentResourceIds={selectableProjectTaskIDs} resourceType={SelectedResourceType.TASKS}>
            {(selectProps) => (
                <>
                    {subsets.map((subset: string) => (
                        <React.Fragment key={subset}>
                            {subset && <Title level={4}>{subset}</Title>}
                            {renderTasksForSubset(subset, selectProps)}
                        </React.Fragment>
                    ))}
                    <Row justify='center' align='middle'>
                        <Col md={22} lg={18} xl={16} xxl={14}>
                            <Pagination
                                className='cvat-project-tasks-pagination'
                                onChange={(page, pageSize) => {
                                    dispatch(getProjectTasksAsync({ ...tasksQuery, projectId: id, page, pageSize }));
                                }}
                                total={tasksCount}
                                pageSize={tasksQuery.pageSize}
                                current={tasksQuery.page}
                                showQuickJumper
                            />
                        </Col>
                    </Row>
                </>
            )}
        </BulkWrapper>
    ) : (
        <Empty description='No tasks found' />
    );

    return (
        <Row justify='center' align='top' className='cvat-project-page'>
            { isProjectUpdating ? <CVATLoadingSpinner size='large' /> : null }
            <Col md={22} lg={18} xl={16} xxl={14}>
                {/* Sadece Admin veya yetkili kişiler üst barı ve detayları görebilir (Opsiyonel sadeleştirme) */}
                {user.isStaff && (
                    <>
                        <ProjectTopBar projectInstance={projectInstance} onUpdateProject={onUpdateProject} />
                        <DetailsComponent onUpdateProject={onUpdateProject} project={projectInstance} />
                    </>
                )}

                <Row justify='space-between' align='middle' className='cvat-project-page-tasks-bar'>
                    <Col span={24}>
                        <div className='cvat-project-page-tasks-filters-wrapper'>
                            <Input.Search
                                enterButton
                                onSearch={(_search) => {
                                    dispatch(getProjectTasksAsync({ ...tasksQuery, page: 1, projectId: id, search: _search }));
                                }}
                                defaultValue={tasksQuery.search ?? ''}
                                className='cvat-project-page-tasks-search-bar'
                                placeholder='Search tasks...'
                            />
                            <div>
                                <SortingComponent
                                    visible={visibility.sorting}
                                    onVisibleChange={(visible) => setVisibility({ ...defaultVisibility, sorting: visible })}
                                    defaultFields={tasksQuery.sort?.split(',') || ['-ID']}
                                    sortingFields={['ID', 'Status', 'Assignee', 'Updated date']}
                                    onApplySorting={(sorting) => {
                                        dispatch(getProjectTasksAsync({ ...tasksQuery, page: 1, projectId: id, sort: sorting }));
                                    }}
                                />
                                <FilteringComponent
                                    value={updatedQuery.filter}
                                    onApplyFilter={(filter) => {
                                        dispatch(getProjectTasksAsync({ ...tasksQuery, page: 1, projectId: id, filter }));
                                    }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
                { tasksFetching && !bulkFetching ? <Spin size='large' className='cvat-spinner' /> : content }
            </Col>
        </Row>
    );
}