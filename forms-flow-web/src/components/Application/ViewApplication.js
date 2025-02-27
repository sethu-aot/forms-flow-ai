import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import startCase from "lodash/startCase";

import { Tabs, Tab } from "react-bootstrap";
import Details from "./Details";
import { getApplicationById } from "../../apiManager/services/applicationServices";
import Loading from "../../containers/Loading";
import {
  setApplicationDetailLoader,
  setApplicationDetailStatusCode,
} from "../../actions/applicationActions";
import History from "./ApplicationHistory";
import View from "../../routes/Submit/Submission/Item/View";
import { getForm, getSubmission } from "@aot-technologies/formio-react";
import NotFound from "../NotFound";
import { Translation,useTranslation } from "react-i18next";
import { CUSTOM_SUBMISSION_URL,CUSTOM_SUBMISSION_ENABLE, MULTITENANCY_ENABLED } from "../../constants/constants";
import { fetchAllBpmProcesses } from "../../apiManager/services/processServices";
import { getCustomSubmission } from "../../apiManager/services/FormServices";

const ViewApplication = React.memo(() => {
  const {t} = useTranslation();
  const { applicationId } = useParams();
  const applicationDetail = useSelector(
    (state) => state.applications.applicationDetail
  );
  const applicationDetailStatusCode = useSelector(
    (state) => state.applications.applicationDetailStatusCode
  );
  const isApplicationDetailLoading = useSelector(
    (state) => state.applications.isApplicationDetailLoading
  );
  const tenantKey = useSelector((state) => state.tenants?.tenantId);
  const dispatch = useDispatch();
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  useEffect(() => {
    dispatch(setApplicationDetailLoader(true));
    dispatch(
      getApplicationById(applicationId, (err, res) => {
        if (!err) {
          if (res.submissionId && res.formId) {
            dispatch(getForm("form", res.formId));
            if(CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE){
              dispatch(getCustomSubmission(res.submissionId,res.formId));
            }else{
              dispatch(getSubmission("submission", res.submissionId, res.formId));
            }
          }
        }
      })
    );
    return () => {
      dispatch(setApplicationDetailLoader(true));
      dispatch(setApplicationDetailStatusCode(""));
    };
  }, [applicationId, dispatch]);

  useEffect(() => {
    if (tenantKey) {
      dispatch(fetchAllBpmProcesses());
    }
  }, [dispatch, tenantKey]);

  if (isApplicationDetailLoading) {
    return <Loading />;
  }

  if (
    Object.keys(applicationDetail).length === 0 &&
    applicationDetailStatusCode === 403
  ) {
    return (
      <NotFound
        errorMessage={t("Access Denied")}
        errorCode={applicationDetailStatusCode}
      />
    );
  }

  return (
    <div className="">
      <div className="d-flex align-items-center">
        <Link data-testid="back-to-submissions-link" title={t("Back to Submissions")} to={`${redirectUrl}application`} className="">
          <i className="fa fa-chevron-left fa-lg me-2" />
        </Link>
        <h3 className=" text-truncate">
          <span className="application-head-details">
            <i className="fa fa-list-alt me-2" aria-hidden="true" />
            &nbsp; <Translation>{(t) => t("Submissions")}</Translation> /
          </span>{" "}
          {`${startCase(applicationDetail.applicationName)}`}
        </h3>
      </div>
      <br />
      <Tabs id="application-details" defaultActiveKey="details" mountOnEnter>
        <Tab
          data-testid="submissions-details-tab"
          eventKey="details"
          title={<Translation>{(t) => t("Details")}</Translation>}
        >
          <Details application={applicationDetail} />
        </Tab>
        <Tab
          data-testid="submissions-form-tab"
          eventKey="form"
          title={<Translation>{(t) => t("Form")}</Translation>}
        >
          <View page="application-detail" />
        </Tab>
        <Tab
          data-testid="submissions-history-tab"
          eventKey="history"
          title={<Translation>{(t) => t("History")}</Translation>}
          className="service-task-details"
        >
          <History page="application-detail" applicationId={applicationId} />
        </Tab>
      </Tabs>
    </div>
  );
});

export default ViewApplication;
