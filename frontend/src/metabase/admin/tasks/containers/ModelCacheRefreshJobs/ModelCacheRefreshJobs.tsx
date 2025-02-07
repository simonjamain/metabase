import React, { useCallback } from "react";
import { t } from "ttag";
import moment from "moment";
import { connect } from "react-redux";

import Link from "metabase/core/components/Link";
import DateTime from "metabase/components/DateTime";
import Icon from "metabase/components/Icon";
import Tooltip from "metabase/components/Tooltip";
import PaginationControls from "metabase/components/PaginationControls";

import PersistedModels from "metabase/entities/persisted-models";
import { capitalize } from "metabase/lib/formatting";
import * as Urls from "metabase/lib/urls";

import { usePagination } from "metabase/hooks/use-pagination";

import { ModelCacheRefreshStatus } from "metabase-types/api";

import {
  ErrorBox,
  IconButtonContainer,
  PaginationControlsContainer,
  StyledLink,
} from "./ModelCacheRefreshJobs.styled";

type JobTableItemProps = {
  job: ModelCacheRefreshStatus;
  onRefresh: () => void;
};

function JobTableItem({ job, onRefresh }: JobTableItemProps) {
  const modelUrl = Urls.dataset({ id: job.card_id, name: job.card_name });
  const collectionUrl = Urls.collection({
    id: job.collection_id,
    name: job.collection_name,
  });

  const lastRunAtLabel = capitalize(moment(job.refresh_begin).fromNow());

  const renderStatus = useCallback(() => {
    if (job.state === "refreshing") {
      return t`Refreshing`;
    }
    if (job.state === "persisted") {
      return t`Completed`;
    }
    if (job.state === "error") {
      return (
        <Link to={`/admin/tools/model-caching/${job.id}`}>
          <ErrorBox>{job.error}</ErrorBox>
        </Link>
      );
    }
    return job.state;
  }, [job]);

  return (
    <tr key={job.id}>
      <th>
        <span>
          <StyledLink to={modelUrl}>{job.card_name}</StyledLink> {t`in`}{" "}
          <StyledLink to={collectionUrl}>
            {job.collection_name || t`Our analytics`}
          </StyledLink>
        </span>
      </th>
      <th>{renderStatus()}</th>
      <th>
        <Tooltip tooltip={<DateTime value={job.refresh_begin} />}>
          {lastRunAtLabel}
        </Tooltip>
      </th>
      <th>{job.creator.common_name}</th>
      <th>
        <Tooltip tooltip={t`Refresh`}>
          <IconButtonContainer onClick={onRefresh}>
            <Icon name="refresh" />
          </IconButtonContainer>
        </Tooltip>
      </th>
    </tr>
  );
}

const PAGE_SIZE = 20;

type Props = {
  children: JSX.Element;
  onRefresh: (job: ModelCacheRefreshStatus) => void;
};

type PersistedModelsListLoaderProps = {
  persistedModels: ModelCacheRefreshStatus[];
  metadata: {
    total: number;
    limit: number | null;
    offset: number | null;
  };
};

const mapDispatchToProps = {
  onRefresh: (job: ModelCacheRefreshStatus) =>
    PersistedModels.objectActions.refreshCache(job),
};

function ModelCacheRefreshJobs({ children, onRefresh }: Props) {
  const { page, handleNextPage, handlePreviousPage } = usePagination();

  const query = {
    limit: PAGE_SIZE,
    offset: PAGE_SIZE * page,
  };

  return (
    <>
      <PersistedModels.ListLoader query={query} keepListWhileLoading>
        {({ persistedModels, metadata }: PersistedModelsListLoaderProps) => {
          const hasPagination = metadata.total > PAGE_SIZE;

          return (
            <>
              <table className="ContentTable border-bottom">
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "40%" }} />
                  <col />
                  <col />
                  <col style={{ width: "5%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t`Model`}</th>
                    <th>{t`Status`}</th>
                    <th>{t`Last run at`}</th>
                    <th>{t`Created by`}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {persistedModels.map(job => (
                    <JobTableItem
                      key={job.id}
                      job={job}
                      onRefresh={() => onRefresh(job)}
                    />
                  ))}
                </tbody>
              </table>
              {hasPagination && (
                <PaginationControlsContainer>
                  <PaginationControls
                    showTotal
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={metadata.total}
                    itemsLength={persistedModels.length}
                    onNextPage={handleNextPage}
                    onPreviousPage={handlePreviousPage}
                  />
                </PaginationControlsContainer>
              )}
            </>
          );
        }}
      </PersistedModels.ListLoader>
      {children}
    </>
  );
}

export default connect(null, mapDispatchToProps)(ModelCacheRefreshJobs);
