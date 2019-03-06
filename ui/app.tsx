import React, { useState } from "react";
import styled from "styled-components";
import SplitPane from "react-split-pane";
import { useQuery, useMutation } from "react-apollo-hooks";
import TestExplorer from "./tests-explorer";
import TestFile from "./test-file";
import APP from "./app.gql";
import WORKSPACE from "./query.gql";
import useSubscription from "./test-file/use-subscription";
import SUMMARY_QUERY from "./summary-query.gql";
import SUMMARY_SUBS from "./summary-subscription.gql";
import RUNNER_STATUS_QUERY from "./runner-status-query.gql";
import RUNNER_STATUS_SUBS from "./runner-status-subs.gql";
import { Search } from "./search";
import SET_SELECTED_FILE from "./set-selected-file.gql";
import { Workspace } from "../server/api/workspace/workspace";

const ContainerDiv = styled.div`
  display: flex;
  flex-direction: row;
`;

interface AppResult {
  app: { selectedFile: string };
}

interface WorkspaceResult {
  workspace: Workspace;
}

export default function App() {
  const {
    data: {
      app: { selectedFile }
    },
    refetch
  } = useQuery<AppResult>(APP);

  const {
    data: { workspace },
    refetch: refetchFiles
  } = useQuery<WorkspaceResult>(WORKSPACE);

  const { data: summary = {} } = useSubscription(
    SUMMARY_QUERY,
    SUMMARY_SUBS,
    {},
    result => result.summary,
    result => result.changeToSummary,
    "Summary Sub"
  );

  const { data: runnerStatus } = useSubscription(
    RUNNER_STATUS_QUERY,
    RUNNER_STATUS_SUBS,
    {},
    result => result.runnerStatus,
    result => result.runnerStatusChange,
    "Runner subs"
  );

  const setSelectedFile = useMutation(SET_SELECTED_FILE);
  const handleFileSelection = (path: string) => {
    setSelectedFile({
      variables: {
        path
      }
    });
    refetch();
  };

  const [isSearchOpen, setSearchOpen] = useState(false);

  return (
    <ContainerDiv>
      <SplitPane defaultSize={300} split="vertical">
        <TestExplorer
          workspace={workspace}
          selectedFile={selectedFile}
          onSelectedFileChange={handleFileSelection}
          summary={summary}
          runnerStatus={runnerStatus}
          onSearchOpen={() => {
            setSearchOpen(true);
          }}
          onRefreshFiles={() => {
            refetchFiles();
          }}
        />
        {selectedFile && (
          <TestFile
            projectRoot={workspace.projectRoot}
            selectedFilePath={selectedFile}
            runnerStatus={runnerStatus}
          />
        )}
      </SplitPane>
      <Search
        show={isSearchOpen}
        files={workspace.files}
        onClose={() => setSearchOpen(false)}
        onItemClick={path => {
          handleFileSelection(path);
          setSearchOpen(false);
        }}
      />
    </ContainerDiv>
  );
}
