import "./incidentTable.css";
import React, { FC, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  LabelGroup,
  Label,
  // Toolbar,
  // ToolbarContent,
  // ToolbarGroup,
  // ToolbarItem,
  Dropdown,
  MenuToggleElement,
  MenuToggle,
  MenuToggleCheckbox,
  DropdownList,
  DropdownItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { EnhancedIncident, Incident } from "@editor-extensions/shared";
import { Table, Tr, Tbody, Td } from "@patternfly/react-table";
import { useExtensionStateContext } from "../../context/ExtensionStateContext";
import { openFile } from "../../hooks/actions";
// import GetSolutionDropdown from "../GetSolutionDropdown";
import { getIncidentRelativePath } from "../../utils/incident";
import GetSolutionDropdown from "../GetSolutionDropdown";

export interface EnhancedIncidentTableProps {
  incidents: EnhancedIncident[];
  isReadOnly?: boolean;
}

export const EnhancedIncidentTable: FC<EnhancedIncidentTableProps> = ({
  incidents,
  isReadOnly = false,
}) => {
  const { state, dispatch } = useExtensionStateContext();
  const [focusedIncident, setFocusedIncident] = useState<Incident | null>(null);
  const [selectedIncidents, setSelectedIncidents] = useState<EnhancedIncident[]>([]);
  const [bulkSelection, setBulkSelection] = React.useState("");
  const [isBulkSelectDropdownOpen, setIsBulkSelectDropdownOpen] = useState<boolean>(false);
  const setIncidentSelected = (row: EnhancedIncident, isSelecting: boolean) =>
    setSelectedIncidents((prevSelected) => {
      const otherSelectedIncidents = prevSelected.filter((r) => {
        return r.violationId + r.uri + r.lineNumber !== row.violationId + row.uri + row.lineNumber;
      });
      return isSelecting ? [...otherSelectedIncidents, row] : otherSelectedIncidents;
    });

  const selectAllIncidents = (isSelecting: boolean) =>
    setSelectedIncidents(isSelecting ? incidents.map((r) => r) : []);

  const isIncidentSelected = (row: EnhancedIncident) => selectedIncidents.includes(row);

  const { workspaceRoot } = state;
  const handleIncidentSelect = (incident: Incident) => {
    setFocusedIncident(incident);
    dispatch(openFile(incident.uri, incident.lineNumber ?? 0));
  };

  // Toggle selection for a single incident
  const toggleIncidentSelection = (incident) => {
    setSelectedIncidents(
      (prevSelected) =>
        prevSelected.some((i) => i.violationId + i.uri === incident.violationId + incident.uri)
          ? prevSelected.filter(
              (i) => i.violationId + i.uri !== incident.violationId + incident.uri,
            ) // Deselect
          : [...prevSelected, incident], // Select
    );
  };

  const buildBulkSelectDropdown = () => {
    const numSelected = selectedIncidents.length;
    const allSelected = numSelected === incidents.length;
    const anySelected = numSelected > 0;
    const someChecked = anySelected ? null : false;
    const isChecked = allSelected ? true : someChecked;

    const items = (
      <>
        <DropdownItem value="none">Select none (0 items)</DropdownItem>
        <DropdownItem value="all">Select all ({incidents.length} items)</DropdownItem>
      </>
    );

    return (
      <Dropdown
        role="menu"
        // onSelect={(_event: React.MouseEvent<Element, MouseEvent>, value: string) => {
        //   if (value === 'all') {
        //     selectAllIncidents(bulkSelection !== 'all');
        //   }
        //   } else {
        //     setSelectedIncidents([]);
        //   }
        //   setBulkSelection(value as string);
        // }}
        isOpen={isBulkSelectDropdownOpen}
        onOpenChange={(isOpen: boolean) => setIsBulkSelectDropdownOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isBulkSelectDropdownOpen}
            onClick={() => setIsBulkSelectDropdownOpen(!isBulkSelectDropdownOpen)}
            aria-label="Select cards"
            splitButtonOptions={{
              items: [
                <MenuToggleCheckbox
                  id="split-dropdown-checkbox"
                  key="split-dropdown-checkbox"
                  aria-label={anySelected ? "Deselect all cards" : "Select all cards"}
                  isChecked={isChecked}
                  onClick={() =>
                    anySelected
                      ? setSelectedIncidents([])
                      : selectAllIncidents(bulkSelection !== "all")
                  }
                >
                  {numSelected !== 0 && `${numSelected} selected`}
                </MenuToggleCheckbox>,
              ],
            }}
          ></MenuToggle>
        )}
      >
        <DropdownList>{items}</DropdownList>
      </Dropdown>
    );
  };

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>{buildBulkSelectDropdown()}</ToolbarItem>
          </ToolbarGroup>
          <ToolbarItem align={{ default: "alignEnd" }}>
            <GetSolutionDropdown incidents={selectedIncidents} scope="in-between" />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table aria-label="Incident Table" borders={true}>
        <Tbody>
          {incidents.map((incident, rowIndex) => {
            return (
              <Tr key={incident.violationId}>
                <Td
                  select={{
                    rowIndex,
                    onSelect: () => toggleIncidentSelection(incident),
                    isSelected: isIncidentSelected(incident),
                  }}
                />
                <Td>
                  <Card
                    isSelectable
                    isSelected={isIncidentSelected(incident)}
                    onClick={() => toggleIncidentSelection(incident)}
                    isCompact
                  >
                    <CardTitle>
                      <b>{incident.ruleset_name}:</b> {incident.violation_description}
                      {"  "}
                      <LabelGroup>
                        {incident.violation_labels?.map((violationLabel) => (
                          <Label key={violationLabel} variant="outline">
                            {violationLabel}
                          </Label>
                        ))}
                      </LabelGroup>
                    </CardTitle>
                    <CardBody>
                      <Badge>{incident.violation_category}</Badge>
                      {"  "}
                      Location:{"  "}
                      <Button
                        component="a"
                        variant="link"
                        isInline
                        onClick={() => handleIncidentSelect(incident)}
                      >
                        {getIncidentRelativePath(incident, workspaceRoot)}:{incident.lineNumber}
                      </Button>
                    </CardBody>
                  </Card>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </>
  );
};
