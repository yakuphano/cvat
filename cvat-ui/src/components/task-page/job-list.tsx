// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import jsonLogic from 'json-logic-js';
import _ from 'lodash';
import { CombinedState, JobsQuery, SelectedResourceType } from 'reducers';
import { useHistory } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import Pagination from 'antd/lib/pagination';
import Empty from 'antd/lib/empty';
import Button from 'antd/lib/button';
import { PlusOutlined } from '@ant-design/icons';
import { Task, Job } from 'cvat-core-wrapper';
import JobItem from 'components/job-item/job-item';
import {
    SortingComponent, ResourceFilterHOC, defaultVisibility, updateHistoryFromQuery, ResourceSelectionInfo,
} from 'components/resource-sorting-filtering';
import { useResourceQuery } from 'utils/hooks';
import BulkWrapper from 'components/bulk-wrapper';
import { selectionActions } from 'actions/selection-actions';
import {
    localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues, config,
} from './jobs-filter-configuration';

const FilteringComponent = ResourceFilterHOC(
    config, localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues,
);

interface Props {
    task: Task;
    onJobUpdate(job: Job, data: Parameters<Job['save']>[0]): void;
}

function filterJobs(jobs: Job[], query: JobsQuery): Job[] {
    let result = jobs;

    if (query.sort) {
        let sort = query.sort.split(',');
        const orders = sort.map((elem: string) => (elem.startsWith('-') ? 'desc' : 'asc'));
        sort = sort.map((elem: string) => (elem.startsWith('-') ? elem.substring(1) : elem));
        const assigneeInd = sort.indexOf('assignee');
        if (assigneeInd > -1) {
            sort[assigneeInd] = 'assignee.username';
        }
        result = _.orderBy(result, sort, orders);
    }
    if (query.filter) {
        const converted = result.map((job) => ({
            assignee: job.assignee ? job.assignee.username : null,
            stage: job.stage,
            state: job.state,
            dimension: job.dimension,
            updatedDate: job.updatedDate,
            type: job.type,
            id: job.id,
            parent_job_id: job.parentJobId,
        }));
        const filter = JSON.parse(query.filter);
        result = result.filter((job, index) => jsonLogic.apply(filter, converted[index]));
    }

    return result;
}

function setUpJobsList(jobs: Job[], newPage: number, pageSize: number): Job[] {
    return jobs.slice((newPage - 1) * pageSize, newPage * pageSize);
}

function JobListComponent(props: Readonly<Props>): JSX.Element {
    const { task: taskInstance, onJobUpdate } = props;
    const [visibility, setVisibility] = useState(defaultVisibility);

    const history = useHistory();
    const { id: taskId, jobs } = taskInstance;

    const defaultQuery: JobsQuery = {
        page: 1,
        pageSize: 10,
        sort: null,
        search: null,
        filter: '{"and":[{"!":{"var":"parent_job_id"}}]}',
    };
    const query = useResourceQuery<JobsQuery>(defaultQuery, defaultQuery);

    const filteredJobs = filterJobs(jobs, query);
    const jobIds = filteredJobs.map((job) => job.id);
    const viewedJobs = setUpJobsList(filteredJobs, query.page, query.pageSize);

    const setQuery = useCallback((nextQuery: JobsQuery) => {
        const nextSearch = updateHistoryFromQuery(nextQuery);
        if (nextSearch === (history.location.search || '')) return;
        history.replace({ search: nextSearch });
    }, [history.location, query]);

    const onCreateJob = useCallback(() => {
        history.push(`/tasks/${taskId}/jobs/create`);
    }, [taskId]);

    const dispatch = useDispatch();
    const { user, selectedCount } = useSelector((state: CombinedState) => ({
        user: state.auth.user,
        selectedCount: state.jobs.selected.length,
    }));

    const onSelectAll = useCallback(() => {
        const allJobIds = viewedJobs.map((job) => job.id);
        dispatch(selectionActions.selectResources(allJobIds, SelectedResourceType.JOBS));
    }, [dispatch, viewedJobs]);

    const onApplyFilter = useCallback((filter: string | null) => {
        setQuery({ ...query, filter: filter || '{}' });
    }, [query, setQuery]);

    return (
        <>
            <div className='cvat-jobs-list-filters-wrapper' style={{ marginBottom: '20px' }}>
                <Row align='middle' justify='space-between'>
                    <Col>
                        <Text className='cvat-text-color cvat-jobs-header' strong style={{ fontSize: '20px' }}> Jobs </Text>
                        {user.isStaff && (
                            <ResourceSelectionInfo selectedCount={selectedCount} onSelectAll={onSelectAll} />
                        )}
                    </Col>
                    {user.isStaff && (
                        <Col>
                            <Row gutter={8}>
                                <Col>
                                    <SortingComponent
                                        visible={visibility.sorting}
                                        onVisibleChange={(v) => setVisibility({ ...defaultVisibility, sorting: v })}
                                        defaultFields={query.sort?.split(',') || ['-ID']}
                                        sortingFields={['ID', 'Assignee', 'State', 'Stage']}
                                        onApplySorting={(sort) => setQuery({ ...query, sort })}
                                    />
                                </Col>
                                <Col>
                                    <FilteringComponent
                                        value={query.filter}
                                        onApplyFilter={onApplyFilter}
                                        onPredefinedVisibleChange={(v) => setVisibility({ ...defaultVisibility, predefined: v })}
                                        onBuilderVisibleChange={(v) => setVisibility({ ...defaultVisibility, builder: v })}
                                        onRecentVisibleChange={(v) => setVisibility({ ...defaultVisibility, recent: v })}
                                    />
                                </Col>
                                <Col>
                                    <Button
                                        onClick={onCreateJob}
                                        type='primary'
                                        icon={<PlusOutlined />}
                                        title="Create new job"
                                    />
                                </Col>
                            </Row>
                        </Col>
                    )}
                </Row>
            </div>

            {jobIds.length ? (
                <div className='cvat-task-job-list'>
                    <Col className='cvat-jobs-list'>
                        <BulkWrapper currentResourceIds={jobIds} resourceType={SelectedResourceType.JOBS}>
                            {(selectProps) => (
                                viewedJobs.map((job: Job, idx: number) => {
                                    const { selected, onClick } = selectProps(job.id, idx);
                                    return (
                                        <JobItem
                                            key={job.id}
                                            job={job}
                                            task={taskInstance}
                                            onJobUpdate={onJobUpdate}
                                            selected={selected}
                                            onClick={user.isStaff ? onClick : () => {}}
                                            onApplyFilter={onApplyFilter}
                                        />
                                    );
                                })
                            )}
                        </BulkWrapper>
                    </Col>
                </div>
            ) : (
                <Empty description='No jobs found' />
            )}

            <Row justify='center' align='middle' style={{ marginTop: '20px' }}>
                <Pagination
                    className='cvat-tasks-pagination'
                    onChange={(page, pageSize) => setQuery({ ...query, page, pageSize })}
                    total={filteredJobs.length}
                    pageSize={query.pageSize}
                    current={query.page}
                    showQuickJumper
                />
            </Row>
        </>
    );
}

export default React.memo(JobListComponent);